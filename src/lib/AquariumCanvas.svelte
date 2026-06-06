<script lang="ts">
  import { Application } from 'pixi.js'
  import { onDestroy } from 'svelte'
  import { createAquariumScene, type AquariumScene } from '../scene/aquarium'
  import type { AquariumConfig } from '../scene/types'

  interface Props {
    config: AquariumConfig
  }

  const { config }: Props = $props()

  let host = $state<HTMLDivElement | null>(null)
  let app: Application | null = null
  let scene: AquariumScene | null = null
  let resizeObserver: ResizeObserver | null = null
  let startError = $state<string | null>(null)

  async function start(): Promise<void> {
    if (host === null) {
      return
    }

    const currentHost = host
    startError = null
    cleanup()
    try {
      const nextApp = new Application()

      await nextApp.init({
        resizeTo: currentHost,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        preference: 'webgl',
        eventFeatures: {
          move: true,
          globalMove: false,
          click: false,
          wheel: false,
        },
      })

      currentHost.appendChild(nextApp.canvas)
      const nextScene = createAquariumScene(nextApp, config)

      nextApp.ticker.add((ticker) => {
        nextScene.update(ticker.deltaMS)
      })

      resizeObserver = new ResizeObserver(() => {
        nextScene.resize(nextApp.screen.width, nextApp.screen.height)
      })
      resizeObserver.observe(currentHost)

      app = nextApp
      scene = nextScene
    } catch (error) {
      startError = error instanceof Error ? error.message : 'PixiJS failed to start.'
      cleanup()
    }
  }

  function cleanup(): void {
    resizeObserver?.disconnect()
    resizeObserver = null
    scene?.destroy()
    scene = null

    if (app !== null) {
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true, texture: true, textureSource: true },
      )
      app = null
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    if (host === null) {
      return
    }

    const bounds = host.getBoundingClientRect()
    scene?.setPointer(event.clientX - bounds.left, event.clientY - bounds.top)
  }

  $effect(() => {
    const seed = config.seed

    if (host === null || seed.length === 0) {
      return
    }

    void start()
  })

  onDestroy(cleanup)
</script>

<div class="aquarium-canvas" bind:this={host} role="img" aria-label="Animated ambient betta aquarium" onpointermove={handlePointerMove}>
  {#if startError !== null}
    <div class="aquarium-fallback" role="status">
      <p>Aquarium could not start.</p>
      <button type="button" onclick={() => void start()}>Retry</button>
    </div>
  {/if}
</div>
