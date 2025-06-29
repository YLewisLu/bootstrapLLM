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

export interface ExecutionGroup {
  level: number;
  tasks: Task[];
  canRunInParallel: boolean;
}

export interface ExecutionPlan {
  totalLevels: number;
  groups: ExecutionGroup[];
  parallelGroups: number;
  sequentialGroups: number;
}

export class TaskMapper {
  private tasks: Task[];

  constructor(tasks: Task[]) {
    this.tasks = tasks;
  }

  /**
   * Analyzes dependencies and creates an execution plan
   * Groups tasks by dependency levels and identifies parallel execution opportunities
   */
  public generateExecutionPlan(): ExecutionPlan {
    const taskMap = new Map<number, Task>();
    this.tasks.forEach(task => taskMap.set(task.step, task));

    // Calculate dependency levels for each task
    const levels = new Map<number, number>();
    const calculateLevel = (taskStep: number): number => {
      if (levels.has(taskStep)) {
        return levels.get(taskStep)!;
      }

      const task = taskMap.get(taskStep);
      if (!task || !task.dependencies || task.dependencies.length === 0) {
        levels.set(taskStep, 0);
        return 0;
      }

      const maxDependencyLevel = Math.max(
        ...task.dependencies.map(dep => calculateLevel(dep))
      );
      const taskLevel = maxDependencyLevel + 1;
      levels.set(taskStep, taskLevel);
      return taskLevel;
    };

    // Calculate levels for all tasks
    this.tasks.forEach(task => calculateLevel(task.step));

    // Group tasks by level
    const levelGroups = new Map<number, Task[]>();
    this.tasks.forEach(task => {
      const level = levels.get(task.step)!;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(task);
    });

    // Create execution groups
    const groups: ExecutionGroup[] = [];
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    
    let parallelGroups = 0;
    let sequentialGroups = 0;

    sortedLevels.forEach(level => {
      const tasksInLevel = levelGroups.get(level)!;
      const canRunInParallel = tasksInLevel.length > 1;
      
      if (canRunInParallel) {
        parallelGroups++;
      } else {
        sequentialGroups++;
      }

      groups.push({
        level,
        tasks: tasksInLevel.sort((a, b) => a.step - b.step),
        canRunInParallel
      });
    });

    return {
      totalLevels: sortedLevels.length,
      groups,
      parallelGroups,
      sequentialGroups
    };
  }

  /**
   * Generates a mermaid flowchart showing task dependencies and execution flow
   */
  public generateMermaidGraph(): string {
    const executionPlan = this.generateExecutionPlan();
    let mermaid = 'flowchart TD\n';
    
    // Add nodes for each task
    this.tasks.forEach(task => {
      const nodeId = `task${task.step}`;
      const actionText = task.param[0].value.length > 50 
        ? task.param[0].value.substring(0, 47) + '...' 
        : task.param[0].value;
      mermaid += `    ${nodeId}["${actionText}"]\n`;
    });

    mermaid += '\n';

    // Add dependency arrows
    this.tasks.forEach(task => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach(depStep => {
          mermaid += `    task${depStep} --> task${task.step}\n`;
        });
      }
    });

    mermaid += '\n';

    // Add styling for parallel groups
    executionPlan.groups.forEach(group => {
      if (group.canRunInParallel && group.tasks.length > 1) {
        const taskIds = group.tasks.map(task => `task${task.step}`).join(',');
        mermaid += `    classDef parallelGroup fill:#e1f5fe,stroke:#01579b,stroke-width:2px\n`;
        mermaid += `    class ${taskIds} parallelGroup\n`;
      }
    });

    // Add legend
    mermaid += '\n    subgraph Legend\n';
    mermaid += '        direction LR\n';
    mermaid += '        legend1["Sequential Task"]:::sequential\n';
    mermaid += '        legend2["Parallel Tasks"]:::parallelGroup\n';
    mermaid += '    end\n';
    mermaid += '    classDef sequential fill:#fff3e0,stroke:#e65100,stroke-width:2px\n';

    return mermaid;
  }

  /**
   * Returns a human-readable execution plan description
   */
  public getExecutionPlanDescription(): string {
    const plan = this.generateExecutionPlan();
    let description = `Execution Plan Analysis:\n`;
    description += `- Total execution levels: ${plan.totalLevels}\n`;
    description += `- Groups that can run in parallel: ${plan.parallelGroups}\n`;
    description += `- Sequential execution groups: ${plan.sequentialGroups}\n\n`;

    description += `Detailed Execution Order:\n`;
    plan.groups.forEach((group, index) => {
      description += `\nLevel ${group.level + 1}`;
      if (group.canRunInParallel) {
        description += ` (PARALLEL EXECUTION - ${group.tasks.length} tasks):\n`;
        group.tasks.forEach(task => {
          description += `  • Step ${task.step}: ${task.action}\n`;
        });
      } else {
        description += ` (SEQUENTIAL):\n`;
        group.tasks.forEach(task => {
          description += `  • Step ${task.step}: ${task.action}\n`;
        });
      }
    });

    return description;
  }

  /**
   * Validates the task dependency graph for cycles
   */
  public validateDependencies(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const taskMap = new Map<number, Task>();
    this.tasks.forEach(task => taskMap.set(task.step, task));

    // Check for missing dependencies
    this.tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(depStep => {
          if (!taskMap.has(depStep)) {
            errors.push(`Task ${task.step} depends on non-existent task ${depStep}`);
          }
        });
      }
    });

    // Check for cycles using DFS
    const visited = new Set<number>();
    const recursionStack = new Set<number>();

    const hasCycle = (taskStep: number): boolean => {
      if (recursionStack.has(taskStep)) {
        return true; // Cycle detected
      }
      if (visited.has(taskStep)) {
        return false;
      }

      visited.add(taskStep);
      recursionStack.add(taskStep);

      const task = taskMap.get(taskStep);
      if (task && task.dependencies) {
        for (const depStep of task.dependencies) {
          if (hasCycle(depStep)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskStep);
      return false;
    };

    this.tasks.forEach(task => {
      if (!visited.has(task.step) && hasCycle(task.step)) {
        errors.push(`Circular dependency detected involving task ${task.step}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
