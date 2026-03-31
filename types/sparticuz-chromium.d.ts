declare module "@sparticuz/chromium" {
  interface ChromiumModule {
    args: string[]
    defaultViewport: {
      width: number
      height: number
      deviceScaleFactor?: number
      isMobile?: boolean
      hasTouch?: boolean
      isLandscape?: boolean
    }
    executablePath: () => Promise<string>
    headless: boolean | "shell"
  }

  const chromium: ChromiumModule
  export default chromium
}

declare module "@sparticuz/chromium-min" {
  interface ChromiumModule {
    args: string[]
    defaultViewport: {
      width: number
      height: number
      deviceScaleFactor?: number
      isMobile?: boolean
      hasTouch?: boolean
      isLandscape?: boolean
    }
    executablePath: (packUrl?: string) => Promise<string>
    headless: boolean | "shell"
  }

  const chromium: ChromiumModule
  export default chromium
}
