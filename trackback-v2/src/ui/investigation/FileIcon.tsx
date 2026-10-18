/** Shared line icons keep the stationery widgets legible at small sizes. */
export function FileIcon({kind}:{kind:string}) {
 const paths:Record<string,string>={
  incident:'M8 5H5v17h14V5h-3M8 3h8v5H8zM8 12h8M8 16h6',
  architecture:'M9 2h6v5H9zM3 17h6v5H3zM15 17h6v5h-6zM12 7v5M6 17v-5h12v5',
  recording:'M2 13h4l3-9 5 17 3-8h5',
  requirements:'M5 3h14v19H5zM8 7h8M8 11h8M8 15h5M8 19h7',
  bench:'M9 2h6M10 2v7L3 20q-1 2 2 2h14q3 0 2-2L14 9V2M7 15h10M10 18h1',
  report:'M3 11L22 2l-7 20-4-8-8-3zM11 14L22 2',
  overview:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  car:'M5 9l2-6h10l2 6M3 9h18v10H3zM6 19v3M18 19v3M6 13h2M16 13h2',
  warning:'M12 3L2 21h20L12 3zM12 9v5M12 17v1',
 }
 return <svg className="file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]??paths.incident}/></svg>
}
