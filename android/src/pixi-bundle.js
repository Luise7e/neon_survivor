// pixi-bundle.js
// Bundle para exponer PixiJS y GlowFilter en el navegador

import * as PIXI from 'pixi.js';
import { GlowFilter } from '@pixi/filter-glow';
import { BlurFilter } from '@pixi/filter-blur';
import { ColorMatrixFilter } from '@pixi/filter-color-matrix';

window.PIXI = PIXI;
if (!PIXI.filters) PIXI.filters = {};
PIXI.filters.GlowFilter = GlowFilter;
PIXI.filters.BlurFilter = BlurFilter;
PIXI.filters.ColorMatrixFilter = ColorMatrixFilter;

// Puedes agregar más filtros aquí si los necesitas
