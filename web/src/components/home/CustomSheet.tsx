import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ICustomSheetProps {
	children: React.ReactNode;
	trigger: React.ReactNode;
}

export function CustomSheet({ children, trigger }: ICustomSheetProps) {
	return (
		<Sheet>
			<SheetTrigger asChild>{trigger}</SheetTrigger>
			<SheetContent>{children}</SheetContent>
		</Sheet>
	);
}
