import { toolAgent } from "../tools/toolAgent";
import { TaskMapper, ExecutionPlan, ExecutionGroup } from "./mapping";

interface TaskParameter {
  name: string;
  value: string;
}

interface Task {
  step: number;
  action: string;
  param: TaskParameter[];
  dependencies: number[] | null;
}

interface TaskResult {
  step: number;
  success: boolean;
  output: string;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

interface ExecutionResult {
  success: boolean;
  results: TaskResult[];
  totalDuration: number;
  parallelExecutions: number;
  sequentialExecutions: number;
  errors: string[];
}

export class TaskExecutor {
  private tasks: Task[];
  private taskMap: Map<number, Task>;
  private results: Map<number, TaskResult>;
  
  constructor(tasks: Task[]) {
    this.tasks = tasks;
    this.taskMap = new Map();
    this.results = new Map();
    
    // Build task map for quick lookup
    this.tasks.forEach(task => {
      this.taskMap.set(task.step, task);
    });
  }

  /**
   * Execute all tasks following the dependency-based execution plan
   */
  public async execute(): Promise<ExecutionResult> {
    const startTime = Date.now();
    const mapper = new TaskMapper(this.tasks);
    
    // Validate dependencies first
    const validation = mapper.validateDependencies();
    if (!validation.isValid) {
      return {
        success: false,
        results: [],
        totalDuration: Date.now() - startTime,
        parallelExecutions: 0,
        sequentialExecutions: 0,
        errors: validation.errors
      };
    }

    // Get execution plan
    const executionPlan = mapper.generateExecutionPlan();
    console.log(`\n🚀 Starting execution of ${this.tasks.length} tasks across ${executionPlan.totalLevels} levels`);
    
    const errors: string[] = [];
    let parallelExecutions = 0;
    let sequentialExecutions = 0;

    // Execute each group in order
    for (const group of executionPlan.groups) {
      console.log(`\n📊 Executing Level ${group.level + 1} - ${group.tasks.length} task(s) ${group.canRunInParallel ? '(PARALLEL)' : '(SEQUENTIAL)'}`);
      
      if (group.canRunInParallel && group.tasks.length > 1) {
        parallelExecutions++;
        await this.executeParallel(group.tasks);
      } else {
        sequentialExecutions++;
        await this.executeSequential(group.tasks);
      }
    }

    // Collect results
    const results = Array.from(this.results.values()).sort((a, b) => a.step - b.step);
    const hasErrors = results.some(result => !result.success);
    
    const totalDuration = Date.now() - startTime;
    
    return {
      success: !hasErrors && errors.length === 0,
      results,
      totalDuration,
      parallelExecutions,
      sequentialExecutions,
      errors
    };
  }

  /**
   * Execute tasks in parallel
   */
  private async executeParallel(tasks: Task[]): Promise<void> {
    const promises = tasks.map(task => this.executeTask(task));
    await Promise.all(promises);
  }

  /**
   * Execute tasks sequentially
   */
  private async executeSequential(tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      await this.executeTask(task);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task): Promise<void> {
    const startTime = new Date();
    console.log(`  ⏳ Executing Step ${task.step}: ${task.action}`);
    
    try {
      let output = "";
      
      if (task.action === "Agent") {
        // Build context from dependencies
        const context = this.buildDependencyContext(task);
        
        // Get the query from parameters
        const queryParam = task.param.find(p => p.name === "query");
        if (!queryParam) {
          throw new Error("No query parameter found for Agent action");
        }
        
        // Call the tool agent with context-enhanced query
        const enhancedQuery = context ? `${context}\n\nCurrent task: ${queryParam.value}` : queryParam.value;
        output = await toolAgent(enhancedQuery);
      } else {
        // Handle other action types if needed in the future
        throw new Error(`Unsupported action type: ${task.action}`);
      }
      
      const endTime = new Date();
      const result: TaskResult = {
        step: task.step,
        success: true,
        output,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime()
      };
      
      this.results.set(task.step, result);
      console.log(`  ✅ Completed Step ${task.step} (${result.duration}ms)`);
      
    } catch (error) {
      const endTime = new Date();
      const result: TaskResult = {
        step: task.step,
        success: false,
        output: "",
        error: error instanceof Error ? error.message : String(error),
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime()
      };
      
      this.results.set(task.step, result);
      console.log(`  ❌ Failed Step ${task.step}: ${result.error}`);
    }
  }

  /**
   * Build context string from dependency outputs
   */
  private buildDependencyContext(task: Task): string {
    if (!task.dependencies || task.dependencies.length === 0) {
      return "";
    }

    let context = "Previous step outputs (for context):\n";
    
    for (const depStep of task.dependencies) {
      const depResult = this.results.get(depStep);
      if (depResult && depResult.success) {
        context += `\n--- Step ${depStep} Output ---\n${depResult.output}\n`;
      } else {
        context += `\n--- Step ${depStep} ---\n[No output available or step failed]\n`;
      }
    }
    
    return context;
  }

  /**
   * Get detailed execution report
   */
  public getExecutionReport(result: ExecutionResult): string {
    let report = "\n" + "=".repeat(60) + "\n";
    report += "EXECUTION REPORT\n";
    report += "=".repeat(60) + "\n";
    
    report += `Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
    report += `Total Duration: ${result.totalDuration}ms\n`;
    report += `Tasks Executed: ${result.results.length}\n`;
    report += `Parallel Groups: ${result.parallelExecutions}\n`;
    report += `Sequential Groups: ${result.sequentialExecutions}\n`;
    
    if (result.errors.length > 0) {
      report += `\n❌ ERRORS:\n`;
      result.errors.forEach(error => {
        report += `  - ${error}\n`;
      });
    }
    
    report += "\n" + "-".repeat(40) + "\n";
    report += "TASK RESULTS\n";
    report += "-".repeat(40) + "\n";
    
    result.results.forEach(taskResult => {
      const status = taskResult.success ? '✅' : '❌';
      report += `\n${status} Step ${taskResult.step} (${taskResult.duration}ms)\n`;
      
      if (taskResult.success) {
        report += `Output: ${taskResult.output}\n`;
      } else {
        report += `Error: ${taskResult.error}\n`;
      }
    });
    
    return report;
  }
}