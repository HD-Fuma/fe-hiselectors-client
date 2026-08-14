import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

const pagesBase = '/fe-hiselectors-client/'
const distDirectory = path.resolve('dist')
const indexPath = path.join(distDirectory, 'index.html')
const indexHtml = await readFile(indexPath, 'utf8')
const assetUrls = [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((url) => !url.startsWith('data:'))

if (!/<link\b[^>]*\brel="icon"[^>]*>/i.test(indexHtml)) {
  throw new Error('Expected the Pages build to declare a favicon')
}

if (assetUrls.length === 0) {
  throw new Error('The Pages build did not emit any asset URLs')
}

for (const assetUrl of assetUrls) {
  if (!assetUrl.startsWith(pagesBase)) {
    throw new Error(
      `Expected Pages asset URL to start with ${pagesBase}, received ${assetUrl}`,
    )
  }

  const relativeAssetPath = assetUrl.slice(pagesBase.length)
  await access(path.join(distDirectory, relativeAssetPath))
}

console.log(
  `Verified ${assetUrls.length} Pages asset URLs under ${pagesBase}`,
)
