'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { CanvasMode } from '@/components/canvas/FloorCanvas';
import { ControlPanel } from '@/components/panels/ControlPanel';
import { useHydronicStore } from '@/store/useHydronicStore';
import { parseDxfFloors } from '@/lib/dxf';
import { computeNetwork, buildBom } from '@/lib/calculation';
import { selectPumps } from '@/lib/pumps';
import {
  exportExcel as exportExcelFile,
  exportPdf as exportPdfFile,
  exportBomCsv,
} from '@/lib/exporters';
import { ExportPayload } from '@/types/hydronics';

const FloorCanvas = dynamic(
  () => import('@/components/canvas/FloorCanvas').then((mod) => mod.FloorCanvas),
  { ssr: false },
);

export default function Home() {
  const {
    floors,
    activeFloorId,
    setFloors,
    setActiveFloor,
    nodes,
    segments,
    radiators,
    collectors,
    settings,
    boiler,
    addNode,
    addSegment,
    addRadiator,
    updateRadiator,
    deleteRadiator,
    updateSettings,
    setBoiler,
    upsertCollector,
  } = useHydronicStore((state) => ({
    floors: state.floors,
    activeFloorId: state.activeFloorId,
    setFloors: state.setFloors,
    setActiveFloor: state.setActiveFloor,
    nodes: state.nodes,
    segments: state.segments,
    radiators: state.radiators,
    collectors: state.collectors,
    settings: state.settings,
    boiler: state.boiler,
    addNode: state.addNode,
    addSegment: state.addSegment,
    addRadiator: state.addRadiator,
    updateRadiator: state.updateRadiator,
    deleteRadiator: state.deleteRadiator,
    updateSettings: state.updateSettings,
    setBoiler: state.setBoiler,
    upsertCollector: state.upsertCollector,
  }));

  const activeFloor = useMemo(
    () => floors.find((floor) => floor.id === activeFloorId) ?? null,
    [floors, activeFloorId],
  );

  const [canvasMode, setCanvasMode] = useState<CanvasMode>('view');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const computation = useMemo(
    () =>
      computeNetwork({
        nodes,
        segments,
        radiators,
        settings,
        boiler,
      }),
    [nodes, segments, radiators, settings, boiler],
  );

  const pumpMatches = useMemo(() => selectPumps(computation), [computation]);
  const bom = useMemo(
    () => (computation ? buildBom(segments, computation.segments) : []),
    [segments, computation],
  );

  const exportPayload = useMemo<ExportPayload>(
    () => ({
      settings,
      floors,
      nodes,
      segments,
      radiators,
      collectors,
      boiler,
      computations: computation,
      pumpMatches,
      bom,
    }),
    [settings, floors, nodes, segments, radiators, collectors, boiler, computation, pumpMatches, bom],
  );

  const handleUploadDxf = async (file: File) => {
    const parsedFloors = await parseDxfFloors(file);
    setFloors(parsedFloors);
  };

  const handleAddNode = (point: { x: number; y: number }) => {
    if (!activeFloorId) return;
    const id = addNode(activeFloorId, {
      x: point.x,
      y: point.y,
    });
    setSelectedNodeId(id);
  };

  const handleCreateSegment = (startNodeId: string, endNodeId: string) => {
    if (!activeFloorId) return;
    addSegment(activeFloorId, {
      label: `L-${segments.length + 1}`,
      startNodeId,
      endNodeId,
      type: 'branch',
    });
  };

  const handleAttachRadiator = (nodeId: string) => {
    const defaultLabel = `R-${radiators.length + 1}`;
    const input = window.prompt('أدخل قدرة الردياتور (W)', '1500');
    if (!input) return;
    const power = Number(input);
    if (!Number.isFinite(power) || power <= 0) return;
    addRadiator({
      nodeId,
      label: defaultLabel,
      powerWatts: power,
    });
  };

  const handleSetBoiler = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    setBoiler({
      nodeId,
      label: node ? `Boiler @ ${node.label}` : 'Boiler',
    });
    setCanvasMode('view');
  };

  const handleAddCollector = (nodeId: string, type: 'supply' | 'return') => {
    const node = nodes.find((item) => item.id === nodeId);
    upsertCollector({
      id: `${type}-${nodeId}`,
      nodeId,
      type,
      label: node ? `${type === 'supply' ? 'SUP' : 'RET'} ${node.label}` : `${type} collector`,
    });
    setCanvasMode('view');
  };

  return (
    <AppShell
      title="Hydronic Designer"
      className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      toolbar={
        boiler ? (
          <span className="rounded-md bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            الغلاية عند: {nodes.find((node) => node.id === boiler.nodeId)?.label ?? boiler.label}
          </span>
        ) : (
          <span className="rounded-md bg-rose-500/10 px-3 py-1 text-xs text-rose-300">
            قم بتعيين موقع الغلاية
          </span>
        )
      }
    >
      <div className="flex flex-1">
        <div className="flex flex-1 flex-col items-center justify-center overflow-hidden">
          <div className="flex w-full flex-1 items-center justify-center p-6">
            <FloorCanvas
              floor={activeFloor}
              nodes={nodes}
              segments={segments}
              radiators={radiators}
              mode={canvasMode}
              selectedNodeId={selectedNodeId ?? undefined}
              onAddNode={handleAddNode}
              onCreateSegment={handleCreateSegment}
              onAttachRadiator={handleAttachRadiator}
              onSetBoiler={handleSetBoiler}
              onAddCollector={handleAddCollector}
              onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
            />
          </div>
        </div>
        <ControlPanel
          floors={floors}
          activeFloorId={activeFloorId}
          onSelectFloor={setActiveFloor}
          onUploadDxf={handleUploadDxf}
          mode={canvasMode}
          onModeChange={setCanvasMode}
          settings={settings}
          onSettingsChange={updateSettings}
          computation={computation}
          pumpMatches={pumpMatches}
          radiators={radiators}
          nodes={nodes}
          onRadiatorChange={updateRadiator}
          onRadiatorDelete={deleteRadiator}
          exports={{
            excel: () => exportExcelFile(exportPayload),
            pdf: () => exportPdfFile(exportPayload),
            bom: () => exportBomCsv(exportPayload),
          }}
        />
      </div>
    </AppShell>
  );
}
