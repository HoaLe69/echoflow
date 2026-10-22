const Voice = {
  Google_US: "Google US English",
  Google_UK_Male: "Google UK English Male",
  Google_UK_Female: "Google UK English Female"
} as const

export type Voice = typeof Voice[keyof typeof Voice]

