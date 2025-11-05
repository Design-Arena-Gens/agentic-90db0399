'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  Boiler,
  Collector,
  FloorPlan,
  HydronicSettings,
  NetworkNode,
  NetworkSegment,
  Radiator,
} from '@/types/hydronics';

type HydronicState = {
  floors: FloorPlan[];
  activeFloorId: string | null;
  nodes: NetworkNode[];
  segments: NetworkSegment[];
  radiators: Radiator[];
  collectors: Collector[];
  boiler: Boiler | null;
  settings: HydronicSettings;
};

type HydronicActions = {
  setFloors: (floors: FloorPlan[]) => void;
  setActiveFloor: (floorId: string | null) => void;
  addNode: (floorId: string, node: Partial<NetworkNode>) => string;
  updateNode: (nodeId: string, payload: Partial<NetworkNode>) => void;
  deleteNode: (nodeId: string) => void;
  addSegment: (floorId: string, segment: Omit<NetworkSegment, 'id' | 'floorId'>) => string;
  updateSegment: (segmentId: string, payload: Partial<NetworkSegment>) => void;
  deleteSegment: (segmentId: string) => void;
  addRadiator: (radiator: Omit<Radiator, 'id'>) => string;
  updateRadiator: (radiatorId: string, payload: Partial<Radiator>) => void;
  deleteRadiator: (radiatorId: string) => void;
  upsertCollector: (collector: Collector) => void;
  deleteCollector: (collectorId: string) => void;
  setBoiler: (boiler: Boiler | null) => void;
  updateSettings: (payload: Partial<HydronicSettings>) => void;
  reset: () => void;
};

const defaultSettings: HydronicSettings = {
  deltaT: 20,
  supplyTemp: 75,
  returnTemp: 55,
  fluidDensity: 998,
  fluidSpecificHeat: 4180,
  maxVelocity: 1.2,
  minVelocity: 0.2,
  frictionFactor: 0.02,
  designPressureDropPerMeter: 200,
};

const initialState: HydronicState = {
  floors: [],
  activeFloorId: null,
  nodes: [],
  segments: [],
  radiators: [],
  collectors: [],
  boiler: null,
  settings: defaultSettings,
};

export const useHydronicStore = create<HydronicState & HydronicActions>((set, get) => ({
  ...initialState,
  setFloors: (floors) => {
    const activeFloorId = floors.length > 0 ? floors[0].id : null;
    set({ floors, activeFloorId });
  },
  setActiveFloor: (floorId) => set({ activeFloorId: floorId }),
  addNode: (floorId, node) => {
    const id = node.id ?? nanoid();
    const label = node.label ?? `N-${get().nodes.length + 1}`;
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id,
          floorId,
          label,
          x: node.x ?? 0,
          y: node.y ?? 0,
          elevation: node.elevation,
          metadata: node.metadata,
        },
      ],
    }));
    return id;
  },
  updateNode: (nodeId, payload) => {
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, ...payload } : node)),
    }));
  },
  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      segments: state.segments.filter(
        (seg) => seg.startNodeId !== nodeId && seg.endNodeId !== nodeId,
      ),
      radiators: state.radiators.filter((rad) => rad.nodeId !== nodeId),
      collectors: state.collectors.filter((col) => col.nodeId !== nodeId),
      boiler: state.boiler?.nodeId === nodeId ? null : state.boiler,
    }));
  },
  addSegment: (floorId, segment) => {
    const id = nanoid();
    set((state) => ({
      segments: [
        ...state.segments,
        {
          ...segment,
          id,
          floorId,
        },
      ],
    }));
    return id;
  },
  updateSegment: (segmentId, payload) => {
    set((state) => ({
      segments: state.segments.map((seg) => (seg.id === segmentId ? { ...seg, ...payload } : seg)),
    }));
  },
  deleteSegment: (segmentId) => {
    set((state) => ({
      segments: state.segments.filter((seg) => seg.id !== segmentId),
    }));
  },
  addRadiator: (radiator) => {
    const id = nanoid();
    set((state) => ({
      radiators: [
        ...state.radiators,
        {
          ...radiator,
          id,
        },
      ],
    }));
    return id;
  },
  updateRadiator: (radiatorId, payload) => {
    set((state) => ({
      radiators: state.radiators.map((rad) =>
        rad.id === radiatorId ? { ...rad, ...payload } : rad,
      ),
    }));
  },
  deleteRadiator: (radiatorId) => {
    set((state) => ({
      radiators: state.radiators.filter((rad) => rad.id !== radiatorId),
    }));
  },
  upsertCollector: (collector) => {
    set((state) => {
      const exists = state.collectors.some((col) => col.id === collector.id);
      if (exists) {
        return {
          collectors: state.collectors.map((col) =>
            col.id === collector.id ? { ...col, ...collector } : col,
          ),
        };
      }
      return {
        collectors: [...state.collectors, collector],
      };
    });
  },
  deleteCollector: (collectorId) => {
    set((state) => ({
      collectors: state.collectors.filter((col) => col.id !== collectorId),
    }));
  },
  setBoiler: (boiler) => set({ boiler }),
  updateSettings: (payload) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ...payload,
      },
    }));
  },
  reset: () => set({ ...initialState }),
}));
