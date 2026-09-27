import type { ExtendedGameStats } from "@/data/extended-game-stats";

// Source-specific columns not represented by the season-leaderboard model.
// A dash means the owner-supplied box score did not establish that value.
export const ownerWeek5DetailedStats: ExtendedGameStats[] = [
  {
    gameId: "jacksboro-at-cisco-2026-week-5", sourceLabel: "Owner-supplied Week 5 offensive box score", teamMetrics: [
      { label: "Rush CAR/YDS/AVG/LONG/TD", away: "—", home: "43/262/6.1/70/4" },
      { label: "Pass C/A/YDS/TD/INT", away: "—", home: "10/14/263/3/0" },
      { label: "Rec REC/YDS/AVG/LONG/TD", away: "—", home: "10/263/26.3/69/3" },
    ], tables: [
      { title: "Passing detail", headers: ["Player", "C/A", "Yds", "C%", "Y/Comp", "TD", "INT", "Long", "Rating"], rows: [
        { player: "Colby McIlroy", schoolSlug: "cisco", values: ["10/14", 263, "71.4", "26.3", 3, 0, 69, "153.3"] },
      ] },
      { title: "Rushing detail", headers: ["Player", "Car", "Yds", "Avg", "Long", "100+", "TD"], rows: [
        { player: "Corbin Harrison", schoolSlug: "cisco", values: [3, 4, "1.3", 3, 0, 0] },
        { player: "Landry Vosburg", schoolSlug: "cisco", values: [5, 15, "3.0", 6, 0, 0] },
        { player: "July Johnson", schoolSlug: "cisco", values: [12, 162, "13.5", 70, 1, 1] },
        { player: "Colby McIlroy", schoolSlug: "cisco", values: [23, 81, "3.5", 28, 0, 3] },
      ] },
      { title: "Receiving detail", headers: ["Player", "Rec", "Yds", "Avg", "Long", "TD"], rows: [
        { player: "Corbin Harrison", schoolSlug: "cisco", values: [2, 28, "14.0", 21, 0] },
        { player: "Gage Johnson", schoolSlug: "cisco", values: [2, 38, "19.0", 20, 0] },
        { player: "Cannon Harris", schoolSlug: "cisco", values: [4, 132, "33.0", 50, 2] },
        { player: "Landry Vosburg", schoolSlug: "cisco", values: [1, -4, "-4.0", 0, 0] },
        { player: "Carter Toof", schoolSlug: "cisco", values: [1, 69, "69.0", 69, 1] },
      ] },
    ],
  },
  {
    gameId: "miles-at-stamford-2026-week-5", sourceLabel: "Owner-supplied Week 5 offensive box score", teamMetrics: [
      { label: "Rush CAR/YDS/AVG/LONG", away: "—", home: "21/212/10.1/30" },
      { label: "Pass C/A/YDS/C%/Y-Comp/TD/Rating", away: "—", home: "13/18/311/72.2/23.9/6/153.9" },
      { label: "Rec REC/YDS/AVG/LONG", away: "—", home: "13/311/23.9/63" },
    ], tables: [
      { title: "Passing detail", headers: ["Player", "C/A", "Yds", "C%", "Y/Comp", "TD", "Rating"], rows: [
        { player: "Miles Follis", schoolSlug: "stamford", values: ["11/16", 294, "68.8", "26.7", 6, "151.0"] },
        { player: "Slayden Young", schoolSlug: "stamford", values: ["2/2", 17, "100", "8.5", "—", "120.8"] },
      ] },
      { title: "Rushing detail", headers: ["Player", "Car", "Yds", "Avg", "Long", "TD"], rows: [
        { player: "Josh Andruch", schoolSlug: "stamford", values: [7, 43, "6.1", 10, "—"] },
        { player: "Slayden Young", schoolSlug: "stamford", values: [3, 67, "22.3", 30, "—"] },
        { player: "Christopher McCann", schoolSlug: "stamford", values: [6, 62, "10.3", 17, "—"] },
        { player: "Brenham Walker", schoolSlug: "stamford", values: [5, 40, "8.0", 19, "—"] },
      ] },
      { title: "Receiving detail", headers: ["Player", "Rec", "Yds", "Avg", "Long", "TD"], rows: [
        { player: "Karsten Hall", schoolSlug: "stamford", values: [2, 17, "8.5", 9, "—"] },
        { player: "C'nai Whitfield", schoolSlug: "stamford", values: [1, 8, "8.0", 8, "—"] },
        { player: "Brennan Armstrong", schoolSlug: "stamford", values: [2, 48, "24.0", 41, "—"] },
        { player: "Slayden Young", schoolSlug: "stamford", values: [3, 36, "12.0", 19, "—"] },
        { player: "Levi Vahlenkamp", schoolSlug: "stamford", values: [4, 139, "34.8", 50, "—"] },
        { player: "Ace Martinez", schoolSlug: "stamford", values: [1, 63, "63.0", 63, "—"] },
      ] },
    ], notes: ["Passing touchdown totals do not identify rushing or receiving touchdown recipients."],
  },
  {
    gameId: "early-at-de-leon-2026-week-5", sourceLabel: "Owner-supplied Week 5 offensive box score", teamMetrics: [
      { label: "Rush CAR/YDS/AVG/100+/TD", away: "—", home: "41/318/7.8/1/3" },
      { label: "Pass C/A/YDS/TD", away: "—", home: "14/20/178/4" },
      { label: "Rec REC/YDS/AVG/TD", away: "—", home: "14/178/12.7/4" },
    ], tables: [
      { title: "Passing detail", headers: ["Player", "C/A", "Yds", "C%", "Y/Comp", "TD", "Rating"], rows: [
        { player: "Hud Price", schoolSlug: "de-leon", values: ["14/20", 178, "70.0", "12.7", 4, "137.1"] },
      ] },
      { title: "Rushing detail", headers: ["Player", "Car", "Yds", "Avg", "100+", "TD"], rows: [
        { player: "Lane Couch", schoolSlug: "de-leon", values: [18, 167, "9.3", 1, 2] },
        { player: "Trenton Zmeskal", schoolSlug: "de-leon", values: [1, 6, "6.0", 0, 1] },
        { player: "Beau Morris", schoolSlug: "de-leon", values: [2, 35, "17.5", 0, "—"] },
        { player: "Hud Price", schoolSlug: "de-leon", values: [7, 65, "9.3", 0, "—"] },
        { player: "Ed Garcia", schoolSlug: "de-leon", values: [13, 45, "3.5", 0, "—"] },
      ] },
      { title: "Receiving detail", headers: ["Player", "Rec", "Yds", "Avg", "TD"], rows: [
        { player: "Bentley Lingle", schoolSlug: "de-leon", values: [1, 10, "10.0", "—"] },
        { player: "Trenton Zmeskal", schoolSlug: "de-leon", values: [1, 3, "3.0", 1] },
        { player: "Andrew Campbell", schoolSlug: "de-leon", values: [2, 7, "3.5", "—"] },
        { player: "Bryce Burkeen", schoolSlug: "de-leon", values: [9, 148, "16.4", 3] },
        { player: "Caden Morganstean", schoolSlug: "de-leon", values: [1, 10, "10.0", "—"] },
      ] },
    ],
  },
  {
    gameId: "tolar-at-comanche-2026-week-5", sourceLabel: "Owner-supplied Week 5 offensive box score", teamMetrics: [
      { label: "Rush CAR/YDS/AVG/TD", away: "—", home: "38/185/4.9/1" },
      { label: "Pass C/A/YDS/TD", away: "—", home: "9/22/153/2" },
      { label: "Rec REC/YDS/AVG/TD", away: "—", home: "9/153/17.0/2" },
    ], tables: [
      { title: "Passing detail", headers: ["Player", "C/A", "Yds", "C%", "Y/Comp", "TD", "Rating"], rows: [
        { player: "Cooper Welch", schoolSlug: "comanche", values: ["9/22", 153, "40.9", "17.0", 2, "95.5"] },
      ] },
      { title: "Rushing detail", headers: ["Player", "Car", "Yds", "Avg", "TD"], rows: [
        { player: "Zaden Tello", schoolSlug: "comanche", values: [16, 79, "4.9", "—"] },
        { player: "Elijah Ozuna", schoolSlug: "comanche", values: [1, 7, "7.0", "—"] },
        { player: "Cooper Welch", schoolSlug: "comanche", values: [5, 41, "8.2", "—"] },
        { player: "Ladanian Smith", schoolSlug: "comanche", values: [14, 52, "3.7", 1] },
        { player: "Nicolas Anaya", schoolSlug: "comanche", values: [2, 6, "3.0", "—"] },
      ] },
      { title: "Receiving detail", headers: ["Player", "Rec", "Yds", "Avg", "TD"], rows: [
        { player: "Zaden Tello", schoolSlug: "comanche", values: [2, 11, "5.5", 1] },
        { player: "Elijah Ozuna", schoolSlug: "comanche", values: [1, 27, "27.0", "—"] },
        { player: "Lukas Morgan", schoolSlug: "comanche", values: [4, 71, "17.8", 1] },
        { player: "Caiden Vargas", schoolSlug: "comanche", values: [1, 28, "28.0", "—"] },
        { player: "Adrian Molina", schoolSlug: "comanche", values: [1, 16, "16.0", "—"] },
      ] },
    ],
  },
];
