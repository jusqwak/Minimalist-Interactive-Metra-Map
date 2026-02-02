import { useState, useMemo } from "react";
import * as TrainLine from "./trainLines";

const LINES = [
  {
    id: "BNSF",
    name: "BNSF",
    color: "#71c543",
    terminal: "Union Station",
    routes: [TrainLine.BNSF_STATIONS],
  },
  {
    id: "HC",
    name: "Heritage Corridor",
    color: "#481210",
    terminal: "Union Station",
    routes: [TrainLine.HC_STATIONS],
  },
  {
    id: "ME",
    name: "Metra Electric",
    color: "#cc6426",
    terminal: "Millennium Station",
    routes: TrainLine.ME_STATIONS,
  },
  {
    id: "MD-N",
    name: "Milwaukee District North",
    color: "#b15b21",
    terminal: "Union Station",
    routes: [TrainLine.MDN_STATIONS],
  },
  {
    id: "MD-W",
    name: "Milwaukee District West",
    color: "#ddb338",
    terminal: "Union Station",
    routes: [TrainLine.MDW_STATIONS],
  },
  {
    id: "NCS",
    name: "North Central Service",
    color: "#9481b9",
    terminal: "Union Station",
    routes: [TrainLine.NCS_STATIONS],
  },
  {
    id: "RI",
    name: "Rock Island",
    color: "#bf321f",
    terminal: "LaSalle Street",
    routes: TrainLine.RI_STATIONS,
  },
  {
    id: "SWS",
    name: "SouthWest Service",
    color: "#2f34a4",
    terminal: "Union Station",
    routes: [TrainLine.SWS_STATIONS],
  },
  {
    id: "UP-N",
    name: "Union Pacific North",
    color: "#45821a",
    terminal: "Ogilvie",
    routes: [TrainLine.UPN_STATIONS],
  },
  {
    id: "UP-NW",
    name: "Union Pacific Northwest",
    color: "#f5ec42",
    terminal: "Ogilvie",
    routes: [TrainLine.UPNW_STATIONS],
  },
  {
    id: "UP-W",
    name: "Union Pacific West",
    color: "#e39185",
    terminal: "Ogilvie",
    routes: [TrainLine.UPW_STATIONS],
  },
];

// SVG layout: hub in center, lines radiate outward like spokes
// Each line gets an angle. Stations are spaced evenly along the spoke.
const SVG_W = 1100;
const SVG_H = 900;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const HUB_R = 52; // radius of the central hub cluster
const MAX_LINE_LEN = 340; // max distance from hub to outermost station


// Temporary grid settings to help plot hub coordinates (editable) 
const GRID_SPACING = 10; // grid every 10 units
const GRID_MAJOR = 50; // visually stronger line every 50 units
//--------------------------------------------------------


// Slight curve per line for visual separation
function getAngle(idx, total) {
  // spread lines in a full circle
  return (idx / total) * 2 * Math.PI - Math.PI / 2;
}

function computeLayout() {
  const layout = LINES.map((line) => {
    const allPoints = [];
    const routePoints = line.routes.map((route) => {
      const pts = route.map((station, i) => {
        return {
          x: CX + station.x,
          y: CY + station.y,
          name: station.name,
          isHub: i === 0 && route === line.routes[0], // first station of first route is hub
        };
      });
      allPoints.push(...pts);
      return pts;
    });
    // Unique points to avoid duplicate rendering
    const uniquePoints = allPoints.filter((point, index, self) =>
      index === self.findIndex(p => p.name === point.name)
    ).map(point => ({
      ...point,
      isTerminus: line.routes.some(route => route[route.length - 1].name === point.name)
    }));
    return { ...line, routePoints, points: uniquePoints };
  });
  return layout;
}
const LAYOUT = computeLayout();

// Build a set of all unique station names for search
const ALL_STATIONS = useMemo ? [...new Set(LINES.flatMap((l) => l.routes.flat()))] : [];

export default function MetraMap() {
  const [selectedLine, setSelectedLine] = useState(null);
  const [search, setSearch] = useState("");
  const [hoveredStation, setHoveredStation] = useState(null);
  const [showGrid, setShowGrid] = useState(false);

  const searchLower = search.toLowerCase().trim();

  // stations matching search
  const matchedStations = useMemo(() => {
    if (!searchLower) return new Set();
    const s = new Set();
    LAYOUT.forEach((line) => {
      line.points.forEach((p) => {
        if (p.name.toLowerCase().includes(searchLower)) s.add(p.name);
      });
    });
    return s;
  }, [searchLower]);

  const isLineVisible = (line) => {
    if (selectedLine) return line.id === selectedLine;
    if (searchLower) {
      // show line if any of its stations match
      return line.points.some((p) => matchedStations.has(p.name));
    }
    return true;
  };

  const dimLine = (line) => {
    if (selectedLine && line.id !== selectedLine) return true;
    if (searchLower && !line.points.some((p) => matchedStations.has(p.name))) return true;
    return false;
  };

  // Top of UI
  return (
    <div style={{ background: "#0f1117", minHeight: "100vh", color: "#e8e8e8", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 12px", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#fff" }}>
          <span style={{ color: "#364ba0" }}>M</span>etra
          <span style={{ fontSize: 13, fontWeight: 400, color: "#666", marginLeft: 10 }}>Chicago Commuter Rail System</span>
        </h1>
      </div>

      {/* Controls */}
      <div style={{ padding: "0 24px 12px", maxWidth: 900, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
          <input
            type="text"
            placeholder="Search stations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedLine(null); }}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              background: "#1a1d26",
              border: "1px solid #2a2d3a",
              borderRadius: 6,
              color: "#fff",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <svg style={{ position: "absolute", left: 10, top: 9, opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>

        {/* Line filter pills */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {LINES.map((line) => {
            const active = selectedLine === line.id;
            return (
              <button
                key={line.id}
                onClick={() => { setSelectedLine(active ? null : line.id); setSearch(""); }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: active ? `2px solid ${line.color}` : "1px solid #2a2d3a",
                  background: active ? line.color + "22" : "transparent",
                  color: active ? line.color : "#999",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {line.id}
              </button>
            );
          })}
          {(selectedLine || search) && (
            <button
              onClick={() => { setSelectedLine(null); setSearch(""); }}
              style={{
                padding: "4px 8px",
                borderRadius: 20,
                border: "1px solid #444",
                background: "transparent",
                color: "#aaa",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Dev toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            id="show-grid"
            style={{ cursor: "pointer" }}
          />
          <label htmlFor="show-grid" style={{ fontSize: 12, color: "#999", cursor: "pointer" }}>
            Show Grid
          </label>
        </div>
      </div>

      {/* SVG Map */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 12px" }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <radialGradient id="hubGlow">
              <stop offset="0%" stopColor="#E8611A" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#E8611A" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Temporary plotting grid: lines every GRID_SPACING units (lighter),
              with stronger lines every GRID_MAJOR units. Remove when done. */}
          {showGrid && <g id="plot-grid" aria-hidden="true">
            {[...Array(Math.floor(SVG_W / GRID_SPACING) + 1)].map((_, i) => {
              const x = i * GRID_SPACING;
              const isMajor = x % GRID_MAJOR === 0;
              return (
                <line
                  key={`v-${x}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={SVG_H}
                  stroke={isMajor ? "#d1cbcbff" : "#e99292ff"}
                  strokeWidth={isMajor ? 0.6 : 0.3}
                  opacity={isMajor ? 0.50 : 0.25}
                />
              );
            })}

            {[...Array(Math.floor(SVG_H / GRID_SPACING) + 1)].map((_, i) => {
              const y = i * GRID_SPACING;
              const isMajor = y % GRID_MAJOR === 0;
              return (
                <line
                  key={`h-${y}`}
                  x1={0}
                  y1={y}
                  x2={SVG_W}
                  y2={y}
                  stroke={isMajor ? "#d1cbcbff" : "#e99292ff"}
                  strokeWidth={isMajor ? 0.6 : 0.3}
                  opacity={isMajor ? 0.12 : 0.06}
                />
              );
            })}

            {/* Grid number labels */}
            {[...Array(Math.floor(SVG_W / GRID_MAJOR) + 1)].map((_, i) => {
              const x = i * GRID_MAJOR;
              const coordX = x - CX;
              return (
                <text
                  key={`label-x-${x}`}
                  x={x}
                  y={15}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#888"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {coordX}
                </text>
              );
            })}

            {[...Array(Math.floor(SVG_H / GRID_MAJOR) + 1)].map((_, i) => {
              const y = i * GRID_MAJOR;
              const coordY = y - CY;
              return (
                <text
                  key={`label-y-${y}`}
                  x={10}
                  y={y + 3}
                  textAnchor="start"
                  fontSize={8}
                  fill="#888"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {coordY}
                </text>
              );
            })}
          </g>}

          {/* Hub glow */}
          <circle cx={CX} cy={CY} r={90} fill="url(#hubGlow)" />

          {/* Hub shape */}
          <rect x={CX - 18} y={CY - 30} width={35} height={50} rx={15} ry={15} stroke="#E8611A" strokeWidth={2} />

          {/* Lines */}
          {LAYOUT.map((line) => {
            const dim = dimLine(line);
            return (
              <g key={line.id} style={{ transition: "opacity 0.3s" }} opacity={dim ? 0.08 : 1}>
                {/* Line paths */}
                {line.routePoints.map((pts, routeIndex) => {
                  const pathD = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
                  return <path key={routeIndex} d={pathD} fill="none" stroke={line.color} strokeWidth={dim ? 2 : 3.5} strokeLinecap="round" />;
                })}

                {/* Stations */}
                {line.points.map((pt, i) => {
                  const isMatch = matchedStations.has(pt.name);
                  const isHovered = hoveredStation === pt.name;
                  const showLabel =
                    isHovered ||
                    (selectedLine === line.id) ||
                    isMatch ||
                    pt.isHub ||
                    pt.isTerminus;

                  // label position: nudge away from center
                  const dx = pt.x - CX;
                  const dy = pt.y - CY;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const labelOffX = (dx / len) * 14;
                  const labelOffY = (dy / len) * 14;
                  // anchor
                  const anchor = dx > 20 ? "start" : dx < -20 ? "end" : "middle";
                  const labelY = dy > 0 ? pt.y + labelOffY + 4 : pt.y + labelOffY - 6;

                  return (
                    <g
                      key={`${line.id}-${pt.name}`}
                      onMouseEnter={() => setHoveredStation(pt.name)}
                      onMouseLeave={() => setHoveredStation(null)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Outer dot */}
                      <circle cx={pt.x} cy={pt.y} r={isMatch ? 7 : pt.isHub ? 5 : 4} fill={line.color} opacity={0.3} />
                      {/* Inner dot */}
                      <circle cx={pt.x} cy={pt.y} r={isMatch ? 5 : pt.isHub ? 3.5 : 2.8} fill={pt.isHub ? "#fff" : line.color} />
                      {/* Highlight ring on match */}
                      {isMatch && <circle cx={pt.x} cy={pt.y} r={9} fill="none" stroke={line.color} strokeWidth={2} opacity={0.6} />}

                      {/* Label */}
                      {showLabel && (
                        <text
                          x={pt.x + (anchor === "start" ? 12 : anchor === "end" ? -12 : 0)}
                          y={labelY}
                          textAnchor={anchor}
                          fontSize={pt.isHub ? 9.5 : isMatch ? 10 : 8.5}
                          fontWeight={pt.isHub || isMatch ? 600 : 400}
                          fill={isMatch ? "#fff" : pt.isHub ? "#ccc" : "#888"}
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          {pt.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Central hub label */}
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#E8611A">CHICAGO</text>
          <text x={CX} y={CY + 5} textAnchor="middle" fontSize={6} fontWeight={400} fill="#666">LOOP</text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 24px 24px", display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
        {LINES.map((line) => (
          <div key={line.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#777" }}>
            <div style={{ width: 18, height: 3, background: line.color, borderRadius: 2 }} />
            <span>{line.name}</span>
          </div>
        ))}
      </div>

      {/* Hover info card */}
      {hoveredStation && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#1e2029", border: "1px solid #333", borderRadius: 10,
          padding: "10px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          fontSize: 13, color: "#fff", pointerEvents: "none", zIndex: 10,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontWeight: 600 }}>{hoveredStation}</span>
          <span style={{ color: "#555", fontSize: 11 }}>
            {LINES.filter((l) => l.routes.flat().some(s => s.name === hoveredStation)).map((l) => (
              <span key={l.id} style={{ display: "inline-block", background: l.color + "33", color: l.color, padding: "2px 7px", borderRadius: 10, marginRight: 4, fontSize: 10, fontWeight: 600 }}>
                {l.id}
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px", textAlign: "center", fontSize: 14, color: "#555", borderTop: "1px solid #2a2d3a" }}>
        <p style={{ margin: "0 0 10px 0" }}>
          A simplified unofficial map of the Chicago Metra rail system. This is NOT an accurate scale of locations or distances.
          <br/> Created for educational purposes with no affiliation to Metra.
        </p>
      </div>
    </div>
  );
}
