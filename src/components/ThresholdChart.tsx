import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { thresholdSeries, type Gestation, MAX_CHART_HOURS } from '../lib/thresholds';

const DAYS = MAX_CHART_HOURS / 24;

type Point = { ageDays: number; sbr: number };

type Props = {
  gestation: Gestation | null;
  currentPoint: Point | null;
  previousPoint: Point | null;
};

const PHOTO_COLOR = '#0f172a';
const EXCH_COLOR = '#475569';
const POINT_COLOR = '#b91c1c';

export default function ThresholdChart({ gestation, currentPoint, previousPoint }: Props) {
  const series = gestation
    ? thresholdSeries(gestation).map((p) => ({
        ageDays: p.hours / 24,
        photo: Math.round(p.photo * 10) / 10,
        exch: Math.round(p.exch * 10) / 10,
      }))
    : [];

  const scatterData: Point[] = [];
  if (previousPoint) scatterData.push(previousPoint);
  if (currentPoint) scatterData.push(currentPoint);

  const yMax = Math.max(
    500,
    ...series.map((p) => p.exch),
    ...(currentPoint ? [currentPoint.sbr + 20] : []),
    ...(previousPoint ? [previousPoint.sbr + 20] : []),
  );

  const connectorData =
    previousPoint && currentPoint
      ? [
          { ageDays: previousPoint.ageDays, connector: previousPoint.sbr },
          { ageDays: currentPoint.ageDays, connector: currentPoint.sbr },
        ]
      : [];

  const chartData = gestation
    ? series
    : [
        { ageDays: 0, photo: null as number | null, exch: null as number | null },
        { ageDays: DAYS, photo: null as number | null, exch: null as number | null },
      ];

  return (
    <div className="h-[360px] w-full sm:h-[460px]" aria-label="Bilirubin threshold chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 16, right: 24, bottom: 28, left: 8 }}
        >
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="ageDays"
            domain={[0, DAYS]}
            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]}
            allowDecimals={false}
            label={{
              value: 'Age (days)',
              position: 'insideBottom',
              offset: -12,
              fill: '#334155',
            }}
            stroke="#64748b"
          />
          <YAxis
            type="number"
            domain={[0, Math.ceil(yMax / 50) * 50]}
            tickCount={8}
            label={{
              value: 'Bilirubin (μmol/L)',
              angle: -90,
              position: 'insideLeft',
              offset: 16,
              fill: '#334155',
            }}
            stroke="#64748b"
          />
          <Tooltip
            formatter={(value: number | string, name) => [
              typeof value === 'number' ? value.toFixed(0) : value,
              name,
            ]}
            labelFormatter={(label) =>
              `Age ${typeof label === 'number' ? label.toFixed(2) : label} days`
            }
          />
          <Legend verticalAlign="top" height={28} />
          {gestation && (
            <>
              <Line
                type="linear"
                dataKey="photo"
                name="Phototherapy"
                stroke={PHOTO_COLOR}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
              <Line
                type="linear"
                dataKey="exch"
                name="Exchange transfusion"
                stroke={EXCH_COLOR}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            </>
          )}
          {connectorData.length === 2 && (
            <Line
              data={connectorData}
              type="linear"
              dataKey="connector"
              name="Reading trajectory"
              stroke={POINT_COLOR}
              strokeWidth={1.5}
              dot={false}
              legendType="none"
              isAnimationActive={false}
            />
          )}
          {previousPoint && (
            <Scatter
              data={[previousPoint]}
              dataKey="sbr"
              name="Previous reading"
              fill="#ffffff"
              stroke={POINT_COLOR}
              shape="circle"
              line={false}
              isAnimationActive={false}
            />
          )}
          {currentPoint && (
            <Scatter
              data={[currentPoint]}
              dataKey="sbr"
              name="Current reading"
              fill={POINT_COLOR}
              stroke={POINT_COLOR}
              shape="circle"
              line={false}
              isAnimationActive={false}
            />
          )}
          {scatterData.length === 0 && (
            <ReferenceLine y={0} stroke="transparent" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
