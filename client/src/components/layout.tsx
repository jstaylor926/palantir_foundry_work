import * as React from "react";
import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
    AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton,
    ListItemIcon, ListItemText, Box, Divider
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InboxIcon from "@mui/icons-material/Inbox";
import CaseIcon from "@mui/icons-material/WorkOutline";
import GateIcon from "@mui/icons-material/Timeline";
import ModelIcon from "@mui/icons-material/Schema";

const drawerWidth = 248;

function Layout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();

    const nav = [
        { to: "/inbox", label: "Inbox", icon: <InboxIcon /> },
        { to: "/cases", label: "Cases", icon: <CaseIcon /> },
        { to: "/gates", label: "Gates", icon: <GateIcon /> },
        { to: "/models", label: "Models", icon: <ModelIcon /> },
    ];

    return (
        <Box sx={{ display: "flex" }}>
            <AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton color="inherit" onClick={() => setOpen(true)} edge="start" sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        DAIA Action Hub
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
                    display: { xs: "none", md: "block" },
                }}
                open
            >
                <Toolbar />
                <Box sx={{ overflow: "auto" }}>
                    <List>
                        {nav.map(item => (
                            <ListItemButton
                                key={item.to}
                                component={Link}
                                to={item.to}
                                selected={pathname.startsWith(item.to)}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        ))}
                    </List>
                    <Divider />
                </Box>
            </Drawer>

            {/* Mobile Drawer */}
            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                sx={{ display: { xs: "block", md: "none" } }}
            >
                <Box sx={{ width: drawerWidth }} role="presentation" onClick={() => setOpen(false)}>
                    <Toolbar />
                    <List>
                        {nav.map(item => (
                            <ListItemButton key={item.to} component={Link} to={item.to}>
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        ))}
                    </List>
                </Box>
            </Drawer>

            {/* Main */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, ml: { md: `${drawerWidth}px` } }}>
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}

export default Layout;