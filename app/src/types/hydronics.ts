export type FloorPlan = {
  id: string;
  name: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  polylines: Array<{
    id: string;
    layer: string;
    points: Array<{ x: number; y: number }>;
  }>;
};

export type PlanEntityPoint = {
  x: number;
  y: number;
};

export type NetworkNode = {
  id: string;
  floorId: string;
  label: string;
  x: number;
  y: number;
  elevation?: number;
  metadata?: Record<string, unknown>;
};

export type SegmentType = 'supply' | 'return' | 'branch';

export type NetworkSegment = {
  id: string;
  floorId: string;
  label: string;
  startNodeId: string;
  endNodeId: string;
  type: SegmentType;
  lengthOverride?: number;
  roughness?: number;
  insulationFactor?: number;
};

export type Radiator = {
  id: string;
  nodeId: string;
  label: string;
  powerWatts: number;
  designDeltaT?: number;
  valveKvOverride?: number;
};

export type Collector = {
  id: string;
  nodeId: string;
  label: string;
  type: 'supply' | 'return';
};

export type Boiler = {
  nodeId: string;
  label: string;
};

export type HydronicSettings = {
  deltaT: number;
  supplyTemp: number;
  returnTemp: number;
  fluidDensity: number;
  fluidSpecificHeat: number;
  maxVelocity: number;
  minVelocity: number;
  frictionFactor: number;
  designPressureDropPerMeter: number;
};

export type SegmentComputation = {
  segmentId: string;
  flowM3h: number;
  flowKgH: number;
  velocity: number;
  diameterMm: number;
  lengthM: number;
  pressureDropPa: number;
  pressureDropPerMeter: number;
  reynolds?: number;
};

export type RadiatorComputation = {
  radiatorId: string;
  flowM3h: number;
  flowKgH: number;
  suggestedKv: number;
};

export type NetworkComputation = {
  segments: SegmentComputation[];
  radiators: RadiatorComputation[];
  totalFlowM3h: number;
  totalPressureDropPa: number;
  worstPath: { segmentIds: string[]; pressureDropPa: number };
};

export type PumpOption = {
  id: string;
  manufacturer: string;
  model: string;
  maxFlowM3h: number;
  maxHeadKpa: number;
  minFlowM3h?: number;
  minHeadKpa?: number;
  efficiencyClass?: string;
  curveRef?: string;
};

export type PumpMatch = {
  option: PumpOption;
  coverage: {
    flow: number;
    head: number;
  };
  notes?: string;
};

export type BomEntry = {
  category: 'pipe' | 'valve' | 'radiator' | 'pump' | 'fitting';
  reference: string;
  description: string;
  quantity: number;
  unit: string;
  metadata?: Record<string, unknown>;
};

export type ExportPayload = {
  settings: HydronicSettings;
  floors: FloorPlan[];
  nodes: NetworkNode[];
  segments: NetworkSegment[];
  radiators: Radiator[];
  collectors: Collector[];
  boiler: Boiler | null;
  computations: NetworkComputation | null;
  pumpMatches: PumpMatch[];
  bom: BomEntry[];
};
