import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

const o = new THREE.Object3D()
const c = new THREE.Color()

/** Generic instanced mesh helper. `fill` writes the transform (and optionally colour) of each instance. */
export function Inst({
  count, geometry, material, fill, cast = true, recv = true, deps = [], visible = true, frustumCulled = true,
}: {
  count: number
  geometry: THREE.BufferGeometry
  material: THREE.Material
  fill: (i: number, obj: THREE.Object3D, color: THREE.Color) => boolean | void
  cast?: boolean
  recv?: boolean
  deps?: unknown[]
  visible?: boolean
  frustumCulled?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    let n = 0
    let useColor = false
    for (let i = 0; i < count; i++) {
      o.position.set(0, 0, 0)
      o.rotation.set(0, 0, 0)
      o.scale.set(1, 1, 1)
      o.rotation.order = 'XYZ'
      c.set(1, 1, 1)
      const r = fill(i, o, c)
      if (r === false) continue
      o.updateMatrix()
      m.setMatrixAt(n, o.matrix)
      m.setColorAt(n, c)
      useColor = true
      n++
    }
    m.count = n
    m.instanceMatrix.needsUpdate = true
    if (useColor && m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, geometry, ...deps])
  return <instancedMesh ref={ref} args={[geometry, material, Math.max(1, count)]} castShadow={cast} receiveShadow={recv} visible={visible} frustumCulled={frustumCulled} />
}
