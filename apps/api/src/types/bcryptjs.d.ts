declare module "bcryptjs" {
	export function hashSync(data: string, saltOrRounds: number): string;
	export function hash(
		data: string,
		saltOrRounds: number,
		callback?: (err: Error | null, hash: string) => void,
	): Promise<string>;
	export function compareSync(data: string, hash: string): boolean;
	export function compare(
		data: string,
		hash: string,
		callback?: (err: Error | null, result: boolean) => void,
	): Promise<boolean>;
	export function genSaltSync(rounds?: number): string;
	export function genSalt(
		rounds?: number,
		callback?: (err: Error | null, salt: string) => void,
	): Promise<string>;
}
