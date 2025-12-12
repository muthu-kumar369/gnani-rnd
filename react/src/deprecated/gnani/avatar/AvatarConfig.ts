// react/src/components/gnani/avatar/AvatarConfig.ts

export type AvatarGender = 'male' | 'female';
export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';
export type Viseme = 'aa' | 'ee' | 'oo' | 'm' | 'neutral' | 'smile';

export const AVATAR_ASSETS = {
    male: {
        base: '/avatars/male_base.png',
    },
    female: {
        base: '/avatars/female_base.png',
    },
    mouths: '/avatars/mouth_sprites.png'
};

// Sprite sheet configuration
// Assuming a grid or strip. Let's assume a horizontal strip for simplicity or mapped coordinates.
// If the image is 512x512 and contains a grid, we need to know the cell size.
// Since I can't see it, I will assume standard equal division.
// Let's assume 3 columns, 2 rows (6 frames).
export const MOUTH_SPRITE_CONFIG = {
    rows: 2,
    cols: 3,
    map: {
        neutral: 0, // Index 0
        smile: 1,
        aa: 2,
        ee: 3,
        oo: 4,
        m: 5
    }
};
