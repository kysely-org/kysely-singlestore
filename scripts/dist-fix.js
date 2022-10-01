const {mkdir, readdir, rename, rm, writeFile, copyFile} = require('node:fs/promises')
const path = require('node:path')

;(async () => {
  const distPath = path.join(__dirname, '../dist')
  const distCjsPath = path.join(distPath, 'cjs')
  const distEsmPath = path.join(distPath, 'esm')

  const [dist] = await Promise.all([readdir(distPath), rm(distCjsPath, {force: true, recursive: true})])

  await Promise.all([
    mkdir(distCjsPath),
    writeFile(path.join(distEsmPath, 'package.json'), JSON.stringify({type: 'module', sideEffects: false})),
    ...dist
      .filter((filePath) => filePath.match(/\.d\.ts$/))
      .map((filePath) => copyFile(path.join(distPath, filePath), path.join(distEsmPath, filePath))),
  ])

  await Promise.all([
    writeFile(path.join(distCjsPath, 'package.json'), JSON.stringify({type: 'commonjs', sideEffects: false})),
    ...dist
      .filter((filePath) => filePath.match(/\.[t|j]s(\.map)?$/))
      .map((filePath) => rename(path.join(distPath, filePath), path.join(distCjsPath, filePath))),
  ])
})()
