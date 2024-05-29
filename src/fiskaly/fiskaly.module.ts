// fiskaly.module.ts
import { Module } from '@nestjs/common';
import { Fiskaly } from './fiskaly';

@Module({
	providers: [Fiskaly],
	exports: [Fiskaly],
})
export class FiskalyModule {}
