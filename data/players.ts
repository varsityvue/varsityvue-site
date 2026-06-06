export type WatchPlayer = {
    id: string;
    schoolSlug: string;
    school: string;
    role: "Offensive Player" | "Defensive Player" | "Dark Horse";
    label: string;
    name: string;
    position: string;
    icon: string;
    note: string;
    featured: boolean;
};

export const watchPlayers: WatchPlayer[] = [
    {
        id: "stephenville-mason-smith",
        schoolSlug: "stephenville",
        school: "Stephenville",
        role: "Offensive Player",
        label: "Offensive Engine",
        name: "Mason Smith",
        position: "QB",
        icon: "⭐",
        note: "Sets the tone for the Yellow Jackets' tempo, rhythm, and explosive-play potential.",
        featured: true,
    },
    {
        id: "stephenville-carter-jones",
        schoolSlug: "stephenville",
        school: "Stephenville",
        role: "Defensive Player",
        label: "Defensive Anchor",
        name: "Carter Jones",
        position: "LB",
        icon: "🛡️",
        note: "A downhill presence who can control the middle and force Heritage into tough downs.",
        featured: true,
    },
    {
        id: "stephenville-tyler-davis",
        schoolSlug: "stephenville",
        school: "Stephenville",
        role: "Dark Horse",
        label: "Breakout Candidate",
        name: "Tyler Davis",
        position: "WR",
        icon: "🔥",
        note: "The kind of under-the-radar weapon who can flip a game if the defense loses track of him.",
        featured: true,
    },
    {
        id: "midlothian-heritage-jace-wilson",
        schoolSlug: "midlothian-heritage",
        school: "Midlothian Heritage",
        role: "Offensive Player",
        label: "Offensive Engine",
        name: "Jace Wilson",
        position: "RB",
        icon: "⭐",
        note: "A physical runner who can stress Stephenville's front and keep the Jaguars ahead of schedule.",
        featured: true,
    },
    {
        id: "midlothian-heritage-ethan-brown",
        schoolSlug: "midlothian-heritage",
        school: "Midlothian Heritage",
        role: "Defensive Player",
        label: "Defensive Disruptor",
        name: "Ethan Brown",
        position: "DE",
        icon: "🛡️",
        note: "Edge pressure is the equalizer. If Brown wins early downs, this matchup tightens fast.",
        featured: true,
    },
    {
        id: "midlothian-heritage-cooper-white",
        schoolSlug: "midlothian-heritage",
        school: "Midlothian Heritage",
        role: "Dark Horse",
        label: "Breakout Candidate",
        name: "Cooper White",
        position: "DB",
        icon: "🔥",
        note: "A secondary piece with a chance to swing momentum if Stephenville tests him vertically.",
        featured: true,
    },
];