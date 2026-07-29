import { ApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';

// Fallback server config for Angular 19 environment (SSR APIs differ between v21 and v19)
export const config: ApplicationConfig = appConfig;
