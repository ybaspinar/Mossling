<script lang="ts">
  import AquariumCanvas from './lib/AquariumCanvas.svelte'
  import { createAquariumConfig } from './scene/config'
  import { normalizeSeed } from './scene/seed'

  const initialSeed = new URLSearchParams(window.location.search).get('seed') ?? 'mossling'
  const initialNormalizedSeed = normalizeSeed(initialSeed)

  let seedInput = $state(initialNormalizedSeed)
  let activeSeed = $state(initialNormalizedSeed)
  let uiHidden = $state(false)
  let copyMessage = $state('')

  const config = $derived(createAquariumConfig(activeSeed))

  function applySeed(): void {
    activeSeed = normalizeSeed(seedInput)
    seedInput = activeSeed
    updateUrl(activeSeed)
  }

  function randomizeSeed(): void {
    const nextSeed = normalizeSeed('')
    seedInput = nextSeed
    activeSeed = nextSeed
    updateUrl(nextSeed)
  }

  async function copyLink(): Promise<void> {
    const url = new URL(window.location.href)
    url.searchParams.set('seed', activeSeed)
    await navigator.clipboard.writeText(url.toString())
    copyMessage = 'Copied link'
    window.setTimeout(() => {
      copyMessage = ''
    }, 1600)
  }

  async function enterFullscreen(): Promise<void> {
    if (document.fullscreenElement === null) {
      await document.documentElement.requestFullscreen()
    }
  }

  function updateUrl(seed: string): void {
    const url = new URL(window.location.href)
    url.searchParams.set('seed', seed)
    window.history.replaceState(null, '', url)
  }
</script>

<main class:ui-hidden={uiHidden}>
  <AquariumCanvas {config} />

  <section class="panel" aria-label="Aquarium controls">
    <div class="brand">
      <p>Mossling</p>
      <h1>Ambient betta aquarium</h1>
    </div>

    <form
      class="seed-form"
      onsubmit={(event) => {
        event.preventDefault()
        applySeed()
      }}
    >
      <label for="seed">Seed</label>
      <div class="seed-row">
        <input id="seed" bind:value={seedInput} autocomplete="off" spellcheck="false" />
        <button type="submit">Apply</button>
      </div>
    </form>

    <div class="actions">
      <button type="button" onclick={randomizeSeed}>Randomize</button>
      <button type="button" onclick={() => void copyLink()}>Copy link</button>
      <button type="button" onclick={() => void enterFullscreen()}>Fullscreen</button>
      <button type="button" onclick={() => { uiHidden = true }}>Hide UI</button>
    </div>

    {#if copyMessage !== ''}
      <p class="copy-message" role="status">{copyMessage}</p>
    {/if}
  </section>

  {#if uiHidden}
    <button class="show-ui" type="button" onclick={() => { uiHidden = false }}>Show UI</button>
  {/if}
</main>
