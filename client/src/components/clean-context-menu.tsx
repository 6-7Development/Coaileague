/**
 * Clean Context Menu - Simple, minimal Google-style context menus
 * Small, clean, hierarchical tree structure with submenus
 */

import { useState, useRef, useEffect } from "react";
import {
  UserCheck, Shield, KeyRound, UserX, VolumeX, Eye, EyeOff,
  ArrowRightLeft, Info, Flag, Award, AlertCircle, MessageCircle,
  Clock, UserCog, FileText, Mail, Star, Ban, ChevronRight
} from "lucide-react";

interface MenuItem {
  id: string;
  label?: string;
  icon?: any;
  onClick?: () => void;
  submenu?: MenuItem[];
  separator?: boolean;
  danger?: boolean;
}

interface CleanContextMenuProps {
  items: MenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export function CleanContextMenu({ items, x, y, onClose }: CleanContextMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleItemClick = (item: MenuItem) => {
    if (item.submenu) {
      return; // Don't close on submenu items
    }
    if (item.onClick) {
      item.onClick();
    }
    onClose();
  };

  const handleMouseEnter = (item: MenuItem, event: React.MouseEvent) => {
    if (item.submenu) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setSubmenuPosition({
        x: rect.right - 2,
        y: rect.top
      });
      setActiveSubmenu(item.id);
    } else {
      setActiveSubmenu(null);
      setSubmenuPosition(null);
    }
  };

  return (
    <>
      {/* Main Menu */}
      <div
        ref={menuRef}
        className="fixed z-[9999] min-w-[180px] bg-white dark:bg-slate-800 rounded-md shadow-xl border border-slate-200 dark:border-slate-700 py-1"
        style={{ left: x, top: y }}
        data-testid="clean-context-menu"
      >
        {items.map((item, index) => (
          <div key={item.id}>
            {item.separator ? (
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
            ) : (
              <button
                className={`
                  w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 transition-colors
                  ${item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
                onClick={() => handleItemClick(item)}
                onMouseEnter={(e) => handleMouseEnter(item, e)}
                data-testid={`menu-item-${item.id}`}
              >
                {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                <span className="flex-1">{item.label}</span>
                {item.submenu && <ChevronRight className="w-3 h-3" />}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Submenu */}
      {activeSubmenu && submenuPosition && (
        <div
          className="fixed z-[10000] min-w-[160px] bg-white dark:bg-slate-800 rounded-md shadow-xl border border-slate-200 dark:border-slate-700 py-1"
          style={{ left: submenuPosition.x, top: submenuPosition.y }}
          onMouseLeave={() => {
            setActiveSubmenu(null);
            setSubmenuPosition(null);
          }}
        >
          {items.find(i => i.id === activeSubmenu)?.submenu?.map((subitem) => (
            <button
              key={subitem.id}
              className={`
                w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 transition-colors
                ${subitem.danger
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
              onClick={() => {
                if (subitem.onClick) {
                  subitem.onClick();
                }
                onClose();
              }}
              data-testid={`submenu-item-${subitem.id}`}
            >
              {subitem.icon && <subitem.icon className="w-4 h-4 flex-shrink-0" />}
              <span>{subitem.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

interface CleanContextMenuWrapperProps {
  items: MenuItem[];
  children: React.ReactNode;
}

export function CleanContextMenuWrapper({ items, children }: CleanContextMenuWrapperProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>
      {contextMenu && (
        <CleanContextMenu
          items={items}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

// Compact Confirmation Dialog - Small, branded, minimal
interface CompactConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function CompactConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false
}: CompactConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-in fade-in">
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200"
        data-testid="compact-confirm-dialog"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
            data-testid="button-cancel"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            data-testid="button-confirm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to create menu items for users
export function createUserMenuItems(
  username: string,
  userRole: string,
  currentUserRole: string,
  handlers: {
    onViewProfile: () => void;
    onQuickReply: () => void;
    onVerifyUser: () => void;
    onAuthenticate: () => void;
    onResetPassword: () => void;
    onHold: () => void;
    onRelease: () => void;
    onMute: () => void;
    onKick: () => void;
    onWarn: () => void;
    onTransfer: () => void;
    onEscalate: () => void;
    onMarkVIP: () => void;
    onAddNote: () => void;
  }
): MenuItem[] {
  const isStaff = ['root_admin', 'deputy_admin', 'deputy_assistant', 'sysop'].includes(currentUserRole);
  
  if (!isStaff) {
    return [
      { id: 'view-profile', label: 'View details', icon: Info, onClick: handlers.onViewProfile },
    ];
  }

  return [
    { id: 'view-profile', label: 'View details', icon: Info, onClick: handlers.onViewProfile },
    { id: 'sep1', separator: true },
    
    // Quick Actions
    { id: 'quick-reply', label: 'Quick reply', icon: MessageCircle, onClick: handlers.onQuickReply },
    { id: 'add-note', label: 'Add internal note', icon: FileText, onClick: handlers.onAddNote },
    
    // Account Actions submenu
    {
      id: 'account-actions',
      label: 'Account actions',
      icon: UserCog,
      submenu: [
        { id: 'verify', label: 'Verify user', icon: UserCheck, onClick: handlers.onVerifyUser },
        { id: 'authenticate', label: 'Request auth', icon: Shield, onClick: handlers.onAuthenticate },
        { id: 'reset-password', label: 'Reset password', icon: KeyRound, onClick: handlers.onResetPassword },
        { id: 'mark-vip', label: 'Mark as VIP', icon: Star, onClick: handlers.onMarkVIP },
      ]
    },
    
    // Moderation submenu
    {
      id: 'moderation',
      label: 'Moderation',
      icon: Shield,
      submenu: [
        { id: 'hold', label: 'Put on hold', icon: EyeOff, onClick: handlers.onHold },
        { id: 'release', label: 'Release hold', icon: Eye, onClick: handlers.onRelease },
        { id: 'warn', label: 'Issue warning', icon: AlertCircle, onClick: handlers.onWarn },
        { id: 'mute', label: 'Mute user', icon: VolumeX, onClick: handlers.onMute, danger: true },
        { id: 'kick', label: 'Kick from chat', icon: UserX, onClick: handlers.onKick, danger: true },
      ]
    },
    
    { id: 'sep2', separator: true },
    
    // Ticket Actions
    { id: 'escalate', label: 'Escalate ticket', icon: Flag, onClick: handlers.onEscalate },
    { id: 'transfer', label: 'Transfer to agent', icon: ArrowRightLeft, onClick: handlers.onTransfer },
  ];
}
