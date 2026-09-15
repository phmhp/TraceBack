/** UI-only fixture. This type cannot represent approved case truth or runtime evidence. */
export interface Placeholder<T> {
  readonly kind: 'PLACEHOLDER'
  readonly value: T
}
