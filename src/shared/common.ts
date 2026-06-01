export const MOBILE_BREAKPOINT = 768;
export const RETRY_DELAY_MS = 1500;



export const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));



export const getInfraColor = (id: string) => {
	switch (id) {
		case "ELEMENTARY_SCHOOL": return "gold";
		case "MIDDLE_SCHOOL": return "skyblue";
		case "HIGH_SCHOOL": return "orange";
		case "SUBWAY_STATION": return "blue";
		case "LARGE_HOSPITAL": return "red";
		case "LARGE_SUPERMARKET": return "purple";
		case "PARK": return "green";
		default: return "#CCCCCC";
	}
}
