export type ScriptAction =
  | { type: "goto"; nodeId: string }
  | { type: "root" }
  | { type: "escalate" }
  | { type: "switch"; scriptId: string }
  | { type: "picker" };

export type ScriptButton = {
  label: string;
  action: ScriptAction;
};

export type ScriptNode = {
  id: string;
  message: string;
  buttons?: ScriptButton[];
  parentId?: string;
  parentLabel?: string;
};

export type ScriptTree = {
  id: string;
  title: string;
  rootId: string;
  nodes: Record<string, ScriptNode>;
};
