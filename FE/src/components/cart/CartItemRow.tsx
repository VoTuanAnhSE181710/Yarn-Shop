import { Link } from "react-router";
import { Trash2, Plus, Minus } from "lucide-react";
import type { Product } from "../../types/product";

interface CartItemRowProps {
  item: Product & { quantity: number };
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemoveItem }: CartItemRowProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border flex gap-6">
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-4 mb-2">
          <Link to={`/product/${item.id}`} className="hover:text-primary transition-colors">
            <h4>{item.name}</h4>
          </Link>
          <button
            onClick={() => onRemoveItem(item.id)}
            className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              className="w-8 h-8 rounded-full border border-border hover:bg-muted transition-colors flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-8 rounded-full border border-border hover:bg-muted transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="font-semibold text-primary">${(item.price * item.quantity).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
