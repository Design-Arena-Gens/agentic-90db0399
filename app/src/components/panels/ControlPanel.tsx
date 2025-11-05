'use client';

import { ChangeEvent, useRef } from 'react';
import { CanvasMode } from '@/components/canvas/FloorCanvas';
import {
  HydronicSettings,
  FloorPlan,
  NetworkComputation,
  NetworkNode,
  Radiator,
  PumpMatch,
} from '@/types/hydronics';
import { formatNumber } from '@/lib/utils';

const modeLabels: Record<CanvasMode, string> = {
  view: 'استعراض',
  'add-node': 'إضافة نقطة',
  'add-segment': 'رسم خط',
  'add-radiator': 'ربط ردياتور',
  'set-boiler': 'تعيين الغلاية',
  'add-collector-supply': 'جامع تغذية',
  'add-collector-return': 'جامع رجوع',
};

type ControlPanelProps = {
  floors: FloorPlan[];
  activeFloorId: string | null;
  onSelectFloor: (floorId: string) => void;
  onUploadDxf: (file: File) => Promise<void>;
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  settings: HydronicSettings;
  onSettingsChange: (changes: Partial<HydronicSettings>) => void;
  computation: NetworkComputation | null;
  pumpMatches: PumpMatch[];
  radiators: Radiator[];
  nodes: NetworkNode[];
  onRadiatorChange: (radiatorId: string, changes: Partial<Radiator>) => void;
  onRadiatorDelete: (radiatorId: string) => void;
  exports: {
    excel: () => void;
    pdf: () => void;
    bom: () => void;
  };
};

export const ControlPanel = ({
  floors,
  activeFloorId,
  onSelectFloor,
  onUploadDxf,
  mode,
  onModeChange,
  settings,
  onSettingsChange,
  computation,
  pumpMatches,
  radiators,
  nodes,
  onRadiatorChange,
  onRadiatorDelete,
  exports,
}: ControlPanelProps) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadDxf(file);
      event.target.value = '';
    }
  };

  return (
    <aside className="flex w-96 flex-col gap-6 overflow-y-auto border-l border-slate-800 bg-slate-900/60 p-6 text-sm">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">الطوابق</h2>
          <button
            className="rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
            onClick={() => fileRef.current?.click()}
          >
            استيراد DXF
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".dxf"
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {floors.length === 0 ? (
            <p className="text-xs text-slate-500">قم بتحميل مخطط الطابق (DXF)</p>
          ) : null}
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => onSelectFloor(floor.id)}
              className={`rounded-md px-3 py-1 text-xs ${
                floor.id === activeFloorId
                  ? 'bg-cyan-500 text-slate-900'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {floor.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-100">أدوات الرسم</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {Object.entries(modeLabels).map(([key, label]) => {
            const canvasMode = key as CanvasMode;
            return (
              <button
                key={canvasMode}
                onClick={() => onModeChange(canvasMode)}
                className={`rounded-md px-3 py-2 text-xs ${
                  mode === canvasMode
                    ? 'bg-indigo-500 text-slate-900'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-100">معاملات التصميم</h2>
        <div className="mt-3 space-y-3 text-xs">
          <label className="flex flex-col gap-1">
            ΔT التصميمي (K)
            <input
              type="number"
              value={settings.deltaT}
              onChange={(event) =>
                onSettingsChange({ deltaT: Number(event.target.value) })
              }
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              تغذية °C
              <input
                type="number"
                value={settings.supplyTemp}
                onChange={(event) =>
                  onSettingsChange({ supplyTemp: Number(event.target.value) })
                }
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1">
              رجوع °C
              <input
                type="number"
                value={settings.returnTemp}
                onChange={(event) =>
                  onSettingsChange({ returnTemp: Number(event.target.value) })
                }
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              السرعة العظمى (م/ث)
              <input
                type="number"
                value={settings.maxVelocity}
                onChange={(event) =>
                  onSettingsChange({ maxVelocity: Number(event.target.value) })
                }
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1">
              السرعة الدنيا (م/ث)
              <input
                type="number"
                value={settings.minVelocity}
                onChange={(event) =>
                  onSettingsChange({ minVelocity: Number(event.target.value) })
                }
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              />
            </label>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-100">الردياتورات</h2>
        <div className="mt-3 space-y-3">
          {radiators.length === 0 ? (
            <p className="text-xs text-slate-500">حدد نقطة ثم استخدم أداة ردياتور لإضافته.</p>
          ) : null}
          {radiators.map((radiator) => {
            const node = nodes.find((n) => n.id === radiator.nodeId);
            return (
              <div
                key={radiator.id}
                className="rounded-md border border-slate-800 bg-slate-900/80 p-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{radiator.label}</span>
                  <span>{node?.label}</span>
                </div>
                <label className="mt-2 flex flex-col gap-1 text-xs text-slate-300">
                  القدرة (W)
                  <input
                    type="number"
                    value={radiator.powerWatts}
                    onChange={(event) =>
                      onRadiatorChange(radiator.id, {
                        powerWatts: Number(event.target.value),
                      })
                    }
                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
                  />
                </label>
                <button
                  onClick={() => onRadiatorDelete(radiator.id)}
                  className="mt-2 w-full rounded-md bg-rose-600/80 py-1 text-xs text-rose-50 hover:bg-rose-600"
                >
                  حذف
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-100">ملخص الحسابات</h2>
        {computation ? (
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>التدفق الكلي</span>
              <span>{formatNumber(computation.totalFlowM3h, { maximumFractionDigits: 2 })} m³/h</span>
            </div>
            <div className="flex justify-between">
              <span>فقدان الضغط</span>
              <span>
                {formatNumber(computation.totalPressureDropPa / 1000, {
                  maximumFractionDigits: 2,
                })}{' '}
                kPa
              </span>
            </div>
            <div className="flex justify-between">
              <span>أسوأ مسار</span>
              <span>{formatNumber(computation.worstPath.pressureDropPa / 1000, { maximumFractionDigits: 2 })} kPa</span>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            عيّن الغلاية وحدد الردياتورات للحصول على النتائج.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-100">المضخة المقترحة</h2>
        <div className="mt-3 space-y-3 text-xs text-slate-300">
          {pumpMatches.length === 0 ? (
            <p className="text-slate-500">لا يوجد اقتراح مناسب. تحقق من الشبكة.</p>
          ) : (
            pumpMatches.map((match) => (
              <div key={match.option.id} className="rounded-md border border-slate-800 p-3">
                <p className="font-semibold text-slate-100">
                  {match.option.manufacturer} {match.option.model}
                </p>
                <p className="mt-1 text-slate-400">
                  تدفق {match.option.maxFlowM3h} m³/h — ضغط {match.option.maxHeadKpa} kPa
                </p>
                <p className="mt-1 text-slate-500">{match.notes}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-100">التقارير</h2>
        <div className="mt-3 flex flex-col gap-2">
          <button
            className="rounded-md bg-emerald-500 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
            onClick={exports.excel}
          >
            تصدير Excel
          </button>
          <button
            className="rounded-md bg-slate-200 py-2 text-xs font-semibold text-slate-900 hover:bg-white"
            onClick={exports.pdf}
          >
            تصدير PDF
          </button>
          <button
            className="rounded-md bg-amber-400 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-300"
            onClick={exports.bom}
          >
            تصدير قائمة المواد BOM
          </button>
        </div>
      </section>
    </aside>
  );
};
