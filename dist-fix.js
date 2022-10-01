const {mkdir, readdir, rename, rm, writeFile, copyFile} = require('node:fs/promises')
const path = require('node:path')

;(async () => {
  const [dist] = await Promise.all([
    readdir(path.join(__dirname, 'dist')),
    rm(path.join(__dirname, 'dist', 'cjs'), {force: true, recursive: true}),
  ])

  await Promise.all([
    mkdir(path.join(__dirname, 'dist', 'cjs')),
    writeFile(
      path.join(__dirname, 'dist', 'esm', 'package.json'),
      JSON.stringify({type: 'module', sideEffects: false}),
    ),
    ...dist
      .filter((filePath) => filePath.match(/\.d\.ts$/))
      .map((filePath) =>
        copyFile(path.join(__dirname, 'dist', filePath), path.join(__dirname, 'dist', 'esm', filePath)),
      ),
  ])

  await Promise.all([
    writeFile(
      path.join(__dirname, 'dist', 'cjs', 'package.json'),
      JSON.stringify({type: 'commonjs', sideEffects: false}),
    ),
    ...dist
      .filter((filePath) => filePath.match(/\.[t|j]s(\.map)?$/))
      .map((filePath) => rename(path.join(__dirname, 'dist', filePath), path.join(__dirname, 'dist', 'cjs', filePath))),
  ])
})()
