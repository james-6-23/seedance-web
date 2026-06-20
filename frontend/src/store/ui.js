import { defineStore } from 'pinia'

const THEME_TRANSITION_MS = 450

function setThemeTransitionClass(on) {
  document.documentElement.classList.toggle('theme-transition', on)
}

function runCircularViewTransition(x, y, callback) {
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  const transition = document.startViewTransition(callback)

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: THEME_TRANSITION_MS,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
    .catch(() => {})
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    dark: true,
    asideShow: true,
    genMode: 'beginner',
  }),
  getters: {
    isBeginner: (state) => state.genMode === 'beginner',
    isPro: (state) => state.genMode === 'pro',
  },
  actions: {
    applyDark() {
      document.documentElement.classList.toggle('dark', this.dark)
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.content = this.dark ? '#06060c' : '#f0eef5'
    },
    toggleDark(event) {
      const x = event?.clientX ?? window.innerWidth / 2
      const y = event?.clientY ?? window.innerHeight / 2

      const apply = () => {
        this.dark = !this.dark
        this.applyDark()
      }

      if (typeof document.startViewTransition === 'function') {
        runCircularViewTransition(x, y, apply)
        return
      }

      setThemeTransitionClass(true)
      apply()
      window.setTimeout(() => setThemeTransitionClass(false), THEME_TRANSITION_MS)
    },
  },
  persist: true,
})