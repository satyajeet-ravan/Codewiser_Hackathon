import { Skill, SkillGraph } from './index';

export class SkillGraphManager {
  private graph: SkillGraph;

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      adjacencyList: new Map(),
      reverseAdjacencyList: new Map()
    };
  }

  addSkill(skill: Skill): void {
    if (this.graph.nodes.has(skill.id)) {
      throw new Error(`Skill with id ${skill.id} already exists`);
    }

    this.graph.nodes.set(skill.id, skill);
    this.graph.adjacencyList.set(skill.id, new Set());
    this.graph.reverseAdjacencyList.set(skill.id, new Set());

    for (const prereqId of skill.prerequisites) {
      if (!this.graph.nodes.has(prereqId)) {
        throw new Error(`Prerequisite skill ${prereqId} not found for skill ${skill.id}`);
      }
      
      this.addEdge(prereqId, skill.id);
    }
  }

  private addEdge(from: string, to: string): void {
    if (!this.graph.edges.has(from)) {
      this.graph.edges.set(from, new Set());
    }
    this.graph.edges.get(from)!.add(to);

    if (!this.graph.adjacencyList.has(from)) {
      this.graph.adjacencyList.set(from, new Set());
    }
    this.graph.adjacencyList.get(from)!.add(to);

    if (!this.graph.reverseAdjacencyList.has(to)) {
      this.graph.reverseAdjacencyList.set(to, new Set());
    }
    this.graph.reverseAdjacencyList.get(to)!.add(from);
  }

  getSkill(id: string): Skill | undefined {
    return this.graph.nodes.get(id);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.graph.nodes.values());
  }

  getPrerequisites(skillId: string): Skill[] {
    const prereqIds = this.graph.reverseAdjacencyList.get(skillId) || new Set();
    return Array.from(prereqIds)
      .map(id => this.graph.nodes.get(id))
      .filter((skill): skill is Skill => skill !== undefined);
  }

  getDependents(skillId: string): Skill[] {
    const dependentIds = this.graph.adjacencyList.get(skillId) || new Set();
    return Array.from(dependentIds)
      .map(id => this.graph.nodes.get(id))
      .filter((skill): skill is Skill => skill !== undefined);
  }

  hasCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = this.graph.adjacencyList.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (hasCycleDFS(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) {
          return true;
        }
      }
    }

    return false;
  }

  validateGraph(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [skillId, skill] of this.graph.nodes) {
      for (const prereqId of skill.prerequisites) {
        if (!this.graph.nodes.has(prereqId)) {
          errors.push(`Skill ${skillId} references non-existent prerequisite ${prereqId}`);
        }
      }
    }

    if (this.hasCycle()) {
      errors.push('Graph contains cycles, which violates DAG requirements');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.getAllSkills().filter(skill => skill.category === category);
  }

  getSkillsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'): Skill[] {
    return this.getAllSkills().filter(skill => skill.difficulty === difficulty);
  }

  getSkillsByTag(tag: string): Skill[] {
    return this.getAllSkills().filter(skill => skill.tags.includes(tag));
  }

  getGraph(): SkillGraph {
    return { ...this.graph };
  }

  clone(): SkillGraphManager {
    const newGraph = new SkillGraphManager();
    for (const skill of this.getAllSkills()) {
      newGraph.addSkill({ ...skill });
    }
    return newGraph;
  }
}
