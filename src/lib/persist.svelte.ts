export class LocalStore<T> {
  value = $state<T>() as T
  key = ''

  constructor(key: string, value: T) {
    this.key = key
    this.value = value

    const item = localStorage.getItem(key)
    if (item) this.value = this.deserialize(item)

    $effect(() => {
      if (this.value) {
        localStorage.setItem(this.key, this.serialize(this.value))
      } else {
        localStorage.removeItem(this.key)
      }
    })
  }

  setValue(value: T) {
    this.value = value
  }

  serialize(value: T): string {
    return JSON.stringify(value)
  }

  deserialize(item: string): T {
    return JSON.parse(item)
  }
}
