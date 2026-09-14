/** Spoonacular serves multiple sizes at predictable URLs; request the larger one for a sharper photo. */
export function highResDishImage(url: string): string {
  return url.replace(/-\d+x\d+\.jpg$/, '-636x393.jpg')
}
