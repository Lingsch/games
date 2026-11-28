// Stars Beneath: the art layer's way in. The game's own code is in ../js; the art code is shared in ../../artkit.
import * as THREE from '../js/three.js';
import * as R from '../js/render.js';
import { S, X, fct } from '../js/core.js';
import { world, hgt } from '../js/world.js';
import * as Cb from '../js/combat.js';
import { SET } from '../js/settings.js';
import { CLASSES, MOBS } from '../js/data.js';
import { INSTANCES } from '../js/dungeons.js';
import * as Flight from '../js/flight2.js';
import { theme } from './theme.js';
import { ABILITY } from './icons.js';
import { initArt } from '../../artkit/art.js';
theme.setInstances(INSTANCES); theme.icons = ABILITY;
initArt({ THREE, R, S, X, fct, world, hgt, Cb, SET, CLASSES, MOBS, INSTANCES, theme, game: 'stars', space: () => Flight.on() });
