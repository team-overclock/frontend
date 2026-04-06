import { NavLink } from "react-router";



export function HomePage() {
	return (
		<>
			home page<br/>
			- <NavLink to="/onboarding">onboarding page</NavLink>
			- <NavLink to="/map">map page</NavLink>
			- <NavLink to="/settings">settings page</NavLink>
		</>
	);
}
