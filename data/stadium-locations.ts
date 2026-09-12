export const stadiumLocations: Record<string, string> = {
  "de-leon": "N Burleson St at Navarro St, De Leon, TX 76444",
};

export function getStadiumAddress(schoolSlug: string) {
  return stadiumLocations[schoolSlug];
}
