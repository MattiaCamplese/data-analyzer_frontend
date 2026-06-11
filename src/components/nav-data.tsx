import { BarChart2, Brain, Database, Users, Building2, BookOpen, Headphones, FileText } from "lucide-react";
import type { LinkItemType } from "./nav-links";

export const productLinks: LinkItemType[] = [
	{
		label: "Analytics",
		href: "#",
		icon: <BarChart2 />,
		description: "Powerful dashboards and data insights",
	},
	{
		label: "AI Assistant",
		href: "#",
		icon: <Brain />,
		description: "AI-powered analysis and recommendations",
	},
	{
		label: "Data Management",
		href: "#",
		icon: <Database />,
		description: "Centralise and manage all your data",
	},
	{
		label: "Collaboration",
		href: "#",
		icon: <Users />,
		description: "Share reports with your team",
	},
];

export const companyLinks: LinkItemType[] = [
	{
		label: "About Us",
		href: "#",
		icon: <Building2 />,
		description: "Learn about our mission and team",
	},
	{
		label: "Blog",
		href: "#",
		icon: <BookOpen />,
		description: "Articles on data and AI",
	},
];

export const companyLinks2: LinkItemType[] = [
	{
		label: "Support",
		href: "#",
		icon: <Headphones />,
		description: "Get help from our team",
	},
	{
		label: "Documentation",
		href: "#",
		icon: <FileText />,
		description: "Guides and API reference",
	},
];
