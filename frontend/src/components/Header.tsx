import { useState } from "react";

interface MenuItem {
	label: string,
	action?: ()=> void,
}

const fileMenu: MenuItem[] = [
	{ label: "New" },
	{ label: "Open" },
	{ label: "Save" },
	{ label: "Export" },
];

const editMenu: MenuItem[] = [
	{ label: "Undo" },
	{ label: "Redo" },
	{ label: "Cut" },
	{ label: "Copy" },
	{ label: "Paste" },
];

const viewMenu: MenuItem[] = [
	{ label: "Zoom In" },
	{ label: "Zoom Out" },
	{ label: "Reset View" },
];

const dropdowns = {
	File: fileMenu,
	Edit: editMenu,
	View: viewMenu,
};

export default function Header() {
	const [openMenu, setOpenMenu] = useState<string | null>(null);

	const toggleMenu = (menu: string) => {
		setOpenMenu((prev) => (prev === menu ? null : menu));
	};

	const closeMenu = () => {
		setOpenMenu(null);
	};

	return (
		<header className="relative z-10 border-b border-gray-300 bg-white text-black px-4 py-1 select-none">
			<nav className="flex gap-6 text-sm font-medium relative">
				{Object.entries(dropdowns).map(([menu, items]) => (
					<div key={menu} className="relative">
						<span
							className="cursor-pointer hover:underline"
							onClick={() => toggleMenu(menu)}
						>
							{menu}
						</span>

						{openMenu === menu && (
							<div
								className="absolute top-full left-0 mt-1 w-40 bg-white shadow border border-gray-200 rounded text-sm"
								onMouseLeave={closeMenu}
							>
								{items.map((item) => (
									<div
										key={item.label}
										className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
										onClick={() => {
											item.action?.();
											closeMenu();
										}}
									>
										{item.label}
									</div>
								))}
							</div>
						)}
					</div>
				))}
				<span className="text-gray-400">…</span>
			</nav>
		</header>
	);
}
