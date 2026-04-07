"use client"

import { useEffect, useRef } from "react"

export default function HospitalScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Load Three.js dynamically
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    script.onload = () => initScene()
    document.head.appendChild(script)

    let animationId: number
    let renderer: any

    function initScene() {
      const THREE = (window as any).THREE
      const container = mountRef.current!
      const w = container.clientWidth
      const h = container.clientHeight

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.setSize(w, h)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      container.appendChild(renderer.domElement)

      // Scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0a0f1e)
      scene.fog = new THREE.Fog(0x0a0f1e, 60, 120)

      // Camera
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200)
      camera.position.set(28, 18, 28)
      camera.lookAt(0, 6, 0)

      // Resize handler
      const handleResize = () => {
        if (!container) return
        const nw = container.clientWidth
        const nh = container.clientHeight
        renderer.setSize(nw, nh)
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
      }
      window.addEventListener("resize", handleResize)

      // Lights
      scene.add(new THREE.AmbientLight(0x334466, 1.2))
      const sun = new THREE.DirectionalLight(0xffeedd, 2.5)
      sun.position.set(20, 40, 20)
      sun.castShadow = true
      sun.shadow.mapSize.set(2048, 2048)
      sun.shadow.camera.near = 1
      sun.shadow.camera.far = 100
      sun.shadow.camera.left = -30
      sun.shadow.camera.right = 30
      sun.shadow.camera.top = 30
      sun.shadow.camera.bottom = -30
      scene.add(sun)
      const fill = new THREE.DirectionalLight(0x4466aa, 0.8)
      fill.position.set(-10, 10, -10)
      scene.add(fill)

      // Materials
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xdde8f0, roughness: 0.3, metalness: 0.05 })
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbee, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.65 })
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x5588aa, roughness: 0.4, metalness: 0.1 })
      const concMat = new THREE.MeshStandardMaterial({ color: 0x99aabb, roughness: 0.8 })
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdd2244, roughness: 0.3, emissive: 0x220011 })
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
      const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a2a1a, roughness: 0.9 })
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x223322, roughness: 0.95 })
      const glassFacadeMat = new THREE.MeshStandardMaterial({ color: 0x6699cc, roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.5 })
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x778899, roughness: 0.2, metalness: 0.4 })
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0xccddee, roughness: 0.2 })
      const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 })
      const treeTopMat = new THREE.MeshStandardMaterial({ color: 0x2d6a2d, roughness: 0.8 })
      const treeTopMat2 = new THREE.MeshStandardMaterial({ color: 0x3a8a3a, roughness: 0.8 })
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.4 })
      const lampGlowMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0x887700, roughness: 0.1 })
      const heliBorderMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x444400, roughness: 0.3 })
      const heliMarkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333 })
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 })
      const ambulanceMat = new THREE.MeshStandardMaterial({ color: 0xcc2233, roughness: 0.3, emissive: 0x110011 })
      const ambBodyMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.2 })
      const flagMat = new THREE.MeshStandardMaterial({ color: 0x0055aa, side: THREE.DoubleSide, roughness: 0.6 })

      function box(w: number, h: number, d: number, mat: any, x: number, y: number, z: number, castS = true, recvS = true) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
        m.position.set(x, y, z)
        m.castShadow = castS
        m.receiveShadow = recvS
        scene.add(m)
        return m
      }

      function cyl(rt: number, rb: number, h: number, seg: number, mat: any, x: number, y: number, z: number) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat)
        m.position.set(x, y, z)
        m.castShadow = true
        scene.add(m)
        return m
      }

      // Ground & Road
      box(100, 0.3, 100, groundMat, 0, -0.15, 0, false, true)
      box(10, 0.05, 60, roadMat, 0, 0.02, 5, false, false)
      box(22, 0.1, 8, concMat, 0, 0.05, 12, false, true)

      // Main Building
      box(24, 3, 14, wallMat, 0, 1.5, 0)
      box(8, 10, 12, wallMat, -10, 5, 0)
      box(8, 10, 12, wallMat, 10, 5, 0)
      box(10, 18, 10, wallMat, 0, 9, 0)

      // Glass facades
      box(9.6, 17, 0.3, glassFacadeMat, 0, 9.1, 5.15)
      box(7.6, 9, 0.3, glassFacadeMat, -10, 5.1, 6.15)
      box(7.6, 9, 0.3, glassFacadeMat, 10, 5.1, 6.15)

      // Window frames - central tower
      for (let row = 0; row < 5; row++)
        for (let col = 0; col < 3; col++)
          box(0.08, 6.5, 0.35, frameMat, -3 + col * 3, 5 + row * 2.6, 5.2)
      for (let row = 0; row < 5; row++)
        box(9, 0.08, 0.35, frameMat, 0, 3.5 + row * 2.6, 5.2)

      // Window frames - wings
      for (const side of [-1, 1])
        for (let row = 0; row < 3; row++)
          for (let col = 0; col < 2; col++) {
            box(0.08, 5, 0.3, frameMat, side * 10 - 1.5 + col * 3, 3 + row * 2.8, 6.2)
            box(7, 0.08, 0.3, frameMat, side * 10, 2 + row * 2.8, 6.2)
          }

      // Roofs
      box(26, 0.6, 16, roofMat, 0, 19, 0)
      box(10, 0.6, 12, roofMat, -10, 10.3, 0)
      box(10, 0.6, 12, roofMat, 10, 10.3, 0)
      box(26, 0.6, 16, roofMat, 0, 3.3, 0)
      box(26, 1, 0.4, wallMat, 0, 19.8, 8.1)
      box(26, 1, 0.4, wallMat, 0, 19.8, -8.1)
      box(0.4, 1, 16, wallMat, 13.1, 19.8, 0)
      box(0.4, 1, 16, wallMat, -13.1, 19.8, 0)

      // Helipad
      cyl(3.5, 3.5, 0.15, 32, concMat, 0, 20.08, 0)
      cyl(3.2, 3.2, 0.05, 32, heliBorderMat, 0, 20.15, 0)
      box(0.3, 0.05, 2.8, heliMarkMat, 0, 20.22, 0)
      box(0.3, 0.05, 2.8, heliMarkMat, -0.8, 20.22, 0)
      box(0.3, 0.05, 2.8, heliMarkMat, 0.8, 20.22, 0)
      box(2, 0.05, 0.3, heliMarkMat, 0, 20.22, 0)

      // Entrance pillars & canopy
      for (const x of [-4, -1.5, 1.5, 4]) cyl(0.25, 0.25, 5, 8, pillarMat, x, 2.5, 7.5)
      box(12, 0.3, 3, roofMat, 0, 5.2, 7)

      // Entrance door
      box(2.5, 3, 0.2, glassMat, 0, 1.65, 6.5)
      box(0.05, 3, 0.2, frameMat, -1.25, 1.65, 6.5)
      box(0.05, 3, 0.2, frameMat, 1.25, 1.65, 6.5)
      box(2.5, 0.05, 0.2, frameMat, 0, 3.05, 6.5)

      // Red cross
      const crossGroup = new THREE.Group()
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.15), redMat)
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.15), redMat)
      crossGroup.add(crossV)
      crossGroup.add(crossH)
      crossGroup.position.set(0, 14.5, 5.2)
      scene.add(crossGroup)

      // Emergency sign
      box(4, 0.8, 0.15, redMat, -8, 2.8, 6.6)
      box(3, 0.12, 0.16, whiteMat, -8, 3, 6.6)
      box(3, 0.12, 0.16, whiteMat, -8, 2.7, 6.6)
      box(3, 0.12, 0.16, whiteMat, -8, 2.4, 6.6)

      // Side wing
      box(6, 6, 8, wallMat, -17, 3, 2)
      box(6, 0.4, 8, roofMat, -17, 6.2, 2)

      // Ambulance bay
      box(8, 0.1, 6, concMat, 16, 0.08, 8, false, true)
      box(2.5, 1.2, 1.3, whiteMat, 16, 0.7, 8)
      box(2, 0.5, 1.3, ambBodyMat, 16.3, 1.55, 8)
      box(2.5, 0.2, 1.3, ambulanceMat, 16, 0.35, 8)
      for (const [tx, tz] of [[15.2, 7.4], [15.2, 8.6], [17, 7.4], [17, 8.6]])
        cyl(0.22, 0.22, 0.15, 12, tireMat, tx, 0.2, tz)

      // Trees
      const tree = (x: number, z: number) => {
        cyl(0.15, 0.2, 1.8, 6, treeTrunkMat, x, 0.9, z)
        cyl(1.5, 0.5, 2.5, 8, treeTopMat, x, 2.8, z)
        cyl(1, 0.2, 1.8, 8, treeTopMat2, x, 4, z)
      }
      ;[[-18, 12], [-18, 8], [-18, 4], [-18, 0], [18, 12], [18, 8], [18, 4],
        [-12, 15], [-6, 15], [6, 15], [12, 15]].forEach(([x, z]) => tree(x, z))

      // Lamp posts
      const lamp = (x: number, z: number) => {
        cyl(0.08, 0.08, 4, 6, lampMat, x, 2, z)
        cyl(0.25, 0.25, 0.2, 8, lampGlowMat, x, 4.1, z)
        const pt = new THREE.PointLight(0xffffaa, 1.5, 12)
        pt.position.set(x, 4.2, z)
        scene.add(pt)
      }
      lamp(-8, 14); lamp(8, 14); lamp(-14, 6); lamp(14, 6)

      // Flagpole & flag
      cyl(0.08, 0.08, 8, 6, concMat, -11, 4, 13)
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.2), flagMat)
      flag.position.set(-10, 8.4, 13)
      scene.add(flag)

      // Stars
      const starGeo = new THREE.BufferGeometry()
      const starPos: number[] = []
      for (let i = 0; i < 300; i++)
        starPos.push((Math.random() - 0.5) * 200, 20 + Math.random() * 60, (Math.random() - 0.5) * 200)
      starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3))
      scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 })))

      // Camera controls
      let angle = Math.PI / 4
      let camDist = 42
      let camElev = 18
      let isDragging = false
      let prevX = 0, prevY = 0
      const target = new THREE.Vector3(0, 6, 0)
      const el = renderer.domElement

      el.addEventListener("mousedown", (e: MouseEvent) => { isDragging = true; prevX = e.clientX; prevY = e.clientY })
      el.addEventListener("mouseup", () => isDragging = false)
      el.addEventListener("mousemove", (e: MouseEvent) => {
        if (!isDragging) return
        angle += (e.clientX - prevX) * 0.008
        camElev = Math.max(3, Math.min(45, camElev - (e.clientY - prevY) * 0.15))
        prevX = e.clientX; prevY = e.clientY
      })
      el.addEventListener("wheel", (e: WheelEvent) => {
        camDist = Math.max(15, Math.min(80, camDist + e.deltaY * 0.05))
        e.preventDefault()
      }, { passive: false })

      let t = 0
      const animate = () => {
        animationId = requestAnimationFrame(animate)
        t += 0.005
        angle += 0.004
        flag.rotation.y = Math.sin(t * 1.5) * 0.3
        camera.position.x = Math.cos(angle) * camDist
        camera.position.z = Math.sin(angle) * camDist
        camera.position.y = camElev
        camera.lookAt(target)
        renderer.render(scene, camera)
      }
      animate()

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize)
        cancelAnimationFrame(animationId)
        renderer.dispose()
        container.removeChild(renderer.domElement)
      }
    }

    return () => {
      cancelAnimationFrame(animationId)
      if (renderer) renderer.dispose()
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "520px", borderRadius: "16px", overflow: "hidden" }}
    />
  )
}
