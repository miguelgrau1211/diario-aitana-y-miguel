
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Image as ImageIcon, FileText, LayoutGrid } from 'lucide-react';

interface AddContentControlProps {
  onAddText: () => void;
  onAddImage: () => void;
}

const menuItems = [
  {
    label: 'Texto',
    icon: FileText,
    action: 'onAddText',
  },
  {
    label: 'Imagen',
    icon: ImageIcon,
    action: 'onAddImage',
  },
  // {
  //   label: 'Galería',
  //   icon: LayoutGrid,
  //   action: 'onAddGallery',
  //   disabled: true,
  // },
];

export function AddContentControl({ onAddText, onAddImage }: AddContentControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (action: string) => {
    setIsOpen(false);
    if (action === 'onAddText') onAddText();
    if (action === 'onAddImage') onAddImage();
  };

  return (
    <div className="flex justify-center items-center my-8 p-4 bg-muted/50 rounded-lg border-2 border-dashed">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button size="lg">
            <Plus className="mr-2" />
            Añadir Contenido
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="center">
          <div className="grid gap-1">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleSelect(item.action)}
                disabled={(item as any).disabled}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
