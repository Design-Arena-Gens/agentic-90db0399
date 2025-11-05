'use client';

import { useMemo, useState } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { Layer, Line, Stage, Text, Circle, Group } from 'react-konva';
import { FloorPlan, NetworkNode, NetworkSegment, Radiator } from '@/types/hydronics';

export type CanvasMode =
  | 'view'
  | 'add-node'
  | 'add-segment'
  | 'add-radiator'
  | 'set-boiler'
  | 'add-collector-supply'
  | 'add-collector-return';

type FloorCanvasProps = {
  floor: FloorPlan | null;
  nodes: NetworkNode[];
  segments: NetworkSegment[];
  radiators: Radiator[];
  mode: CanvasMode;
  selectedNodeId?: string;
  onAddNode: (point: { x: number; y: number }) => void;
  onCreateSegment: (startNodeId: string, endNodeId: string) => void;
  onAttachRadiator: (nodeId: string) => void;
  onSetBoiler: (nodeId: string) => void;
  onAddCollector: (nodeId: string, type: 'supply' | 'return') => void;
  onSelectNode?: (nodeId: string | null) => void;
};

export const FloorCanvas = ({
  floor,
  nodes,
  segments,
  radiators,
  mode,
  selectedNodeId,
  onAddNode,
  onCreateSegment,
  onAttachRadiator,
  onSetBoiler,
  onAddCollector,
  onSelectNode,
}: FloorCanvasProps) => {
  const [pendingSegmentStart, setPendingSegmentStart] = useState<string | null>(null);

  const dimensions = useMemo(() => {
    if (!floor) {
      return {
        width: 800,
        height: 600,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      };
    }
    const padding = 40;
    const width = 800;
    const height = 600;
    const planWidth = floor.bounds.maxX - floor.bounds.minX;
    const planHeight = floor.bounds.maxY - floor.bounds.minY;
    const scale = Math.min(
      (width - padding * 2) / (planWidth || 1),
      (height - padding * 2) / (planHeight || 1),
    );
    const offsetX = floor.bounds.minX;
    const offsetY = floor.bounds.minY;
    return { width, height, scale, offsetX, offsetY };
  }, [floor]);

  const transformPoint = (point: { x: number; y: number }) => {
    const { scale, offsetX, offsetY, width, height } = dimensions;
    const x = (point.x - offsetX) * scale + width * 0.1;
    const y = (point.y - offsetY) * scale + height * 0.1;
    return { x, y };
  };

  const inverseTransform = (canvasPoint: { x: number; y: number }) => {
    if (!floor) return { x: 0, y: 0 };
    const { scale, offsetX, offsetY, width, height } = dimensions;
    return {
      x: (canvasPoint.x - width * 0.1) / scale + offsetX,
      y: (canvasPoint.y - height * 0.1) / scale + offsetY,
    };
  };

  const handleCanvasClick = (event: KonvaEventObject<MouseEvent>) => {
    if (!floor) return;
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const canvasPoint = inverseTransform(pointer);
    if (mode === 'add-node') {
      onAddNode(canvasPoint);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (mode === 'add-segment') {
      if (!pendingSegmentStart) {
        setPendingSegmentStart(nodeId);
      } else if (pendingSegmentStart !== nodeId) {
        onCreateSegment(pendingSegmentStart, nodeId);
        setPendingSegmentStart(null);
      }
      return;
    }
    if (mode === 'add-radiator') {
      onAttachRadiator(nodeId);
      return;
    }
    if (mode === 'set-boiler') {
      onSetBoiler(nodeId);
      return;
    }
    if (mode === 'add-collector-supply') {
      onAddCollector(nodeId, 'supply');
      return;
    }
    if (mode === 'add-collector-return') {
      onAddCollector(nodeId, 'return');
      return;
    }
    setPendingSegmentStart(null);
    onSelectNode?.(nodeId);
  };

  return (
    <div className="relative flex h-full w-full items-stretch">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        className="mx-auto h-full w-full max-w-[1000px] cursor-crosshair rounded-lg bg-slate-900/70 backdrop-blur"
        onClick={handleCanvasClick}
      >
        <Layer>
          {floor?.polylines.map((polyline) => {
            const transformedPoints = polyline.points.flatMap((point) => {
              const { x, y } = transformPoint(point);
              return [x, y];
            });
            return (
              <Line
                key={polyline.id}
                points={transformedPoints}
                stroke="#334155"
                strokeWidth={1}
                closed={false}
              />
            );
          })}
          {segments.map((segment) => {
            const start = nodes.find((node) => node.id === segment.startNodeId);
            const end = nodes.find((node) => node.id === segment.endNodeId);
            if (!start || !end) return null;
            const startPoint = transformPoint(start);
            const endPoint = transformPoint(end);
            const isPending =
              pendingSegmentStart === segment.startNodeId ||
              pendingSegmentStart === segment.endNodeId;
            return (
              <Line
                key={segment.id}
                points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
                stroke={
                  segment.type === 'return'
                    ? '#38bdf8'
                    : segment.type === 'branch'
                    ? '#f97316'
                    : '#22d3ee'
                }
                strokeWidth={segment.type === 'branch' ? 3 : 2}
                dash={isPending ? [4, 4] : undefined}
              />
            );
          })}
          {nodes.map((node) => {
            const { x, y } = transformPoint(node);
            const isSelected = selectedNodeId === node.id;
            const hasRadiator = radiators.some((rad) => rad.nodeId === node.id);
            return (
              <Group
                key={node.id}
                x={x}
                y={y}
                onClick={(event: KonvaEventObject<MouseEvent>) => {
                  event.cancelBubble = true;
                  handleNodeClick(node.id);
                }}
              >
                <Circle
                  radius={8}
                  fill={hasRadiator ? '#f97316' : '#a855f7'}
                  stroke={isSelected ? '#fbbf24' : '#cbd5f5'}
                  strokeWidth={isSelected ? 3 : 2}
                />
                <Text
                  text={node.label}
                  fontSize={12}
                  fill="#e2e8f0"
                  x={10}
                  y={-6}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
      {mode === 'add-segment' && pendingSegmentStart ? (
        <div className="absolute bottom-4 left-4 rounded-md bg-slate-800/80 px-3 py-2 text-sm text-slate-200">
          اختر نقطة النهاية للمسار
        </div>
      ) : null}
    </div>
  );
};
