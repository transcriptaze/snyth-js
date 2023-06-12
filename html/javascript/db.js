export function store (tag, objects) {
  const json = JSON.stringify(objects)

  localStorage.setItem(tag, json)
}

export function retrieve (tag) {
  try {
    return JSON.parse(localStorage.getItem(tag))
  } catch (err) {
    console.error(err)
  }

  return null
}
