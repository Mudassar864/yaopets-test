import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Gift, DollarSign, ArrowLeft, Image, X, Heart } from "lucide-react";
import NativeBottomNavigation from "@/components/mobile/NativeBottomNavigation";

// Donation item interface
interface DonationItem {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  location: string;
  image?: string;
  donorName: string;
  donorId: number;
}

const LOCAL_DONATION_ITEMS_KEY = "yaopets_donation_items";

export default function DonationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Donation items
  const [donationItems, setDonationItems] = useState<DonationItem[]>([]);

  // States for item donation form
  const [itemFormOpen, setItemFormOpen] = useState(false);

  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    location: ""
  });

  // Photo selection
  const [itemPhoto, setItemPhoto] = useState<File | null>(null);
  const [itemPhotoPreview, setItemPhotoPreview] = useState<string | null>(null);
  const itemPhotoInputRef = useRef<HTMLInputElement>(null);

  // Add item for donation
  const handleAddItem = () => {
    setItemForm({
      title: "",
      description: "",
      category: "",
      condition: "",
      location: ""
    });
    setItemPhoto(null);
    setItemPhotoPreview(null);
    setItemFormOpen(true);
  };

  // Select item photo
  const handleItemPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setItemPhoto(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setItemPhotoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Load donation items from localStorage or mock on first load
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      let items: DonationItem[] = [];
      const storage = localStorage.getItem(LOCAL_DONATION_ITEMS_KEY);
      if (storage) {
        try {
          items = JSON.parse(storage);
        } catch (e) {
          items = [];
        }
      }
      // If none in LS, use mock items for demo
      if (!items.length) {
        items = [
          {
            id: 1,
            title: "Premium Dog Food",
            description: "Pack of 10kg premium dog food for adult dogs. Opened but almost full.",
            category: "Food",
            condition: "New",
            location: "São Paulo, SP",
            image: "https://yaopets-media-demo/1747882882851-714.jpg",
            donorName: "Maria Silva",
            donorId: 2
          },
          {
            id: 2,
            title: "Cat Carrier Box",
            description: "Carrier box for small cats, used only once.",
            category: "Accessory",
            condition: "Used - Great condition",
            location: "Rio de Janeiro, RJ",
            image: "https://yaopets-media-demo/1747883030624-652.jpg",
            donorName: "João Pedro",
            donorId: 3
          },
          {
            id: 3,
            title: "Anti-parasite Collar",
            description: "Anti-parasite collar for medium dogs. Not used, only opened.",
            category: "Health",
            condition: "New",
            location: "Belo Horizonte, MG",
            image: "https://yaopets-media-demo/1747883451711-830.jpg",
            donorName: "Ana Luiza",
            donorId: 4
          }
        ];
        localStorage.setItem(LOCAL_DONATION_ITEMS_KEY, JSON.stringify(items));
      }
      setDonationItems(items);
      setIsLoading(false);
    }, 500);
  }, []);

  // Save new item to localStorage
  const handleRegisterItem = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to donate an item.",
        variant: "destructive",
      });
      return;
    }
    if (!itemForm.title || !itemForm.category || !itemForm.condition || !itemForm.location || !itemForm.description) {
      toast({
        title: "Fill all fields",
        description: "Please fill all item fields.",
        variant: "destructive",
      });
      return;
    }

    // Save image as data URL or just keep the preview for demo
    const newItem: DonationItem = {
      id: Date.now(),
      title: itemForm.title,
      description: itemForm.description,
      category: itemForm.category,
      condition: itemForm.condition,
      location: itemForm.location,
      image: itemPhotoPreview || undefined,
      donorName: user.username || user.name || "Anonymous",
      donorId: user.id
    };

    // Update localStorage
    const storage = localStorage.getItem(LOCAL_DONATION_ITEMS_KEY);
    let items: DonationItem[] = [];
    if (storage) {
      try {
        items = JSON.parse(storage);
      } catch (e) {
        items = [];
      }
    }
    items.unshift(newItem);
    localStorage.setItem(LOCAL_DONATION_ITEMS_KEY, JSON.stringify(items));
    setDonationItems(items);

    toast({
      title: "Item registered successfully!",
      description: "Your item is now available for donation."
    });

    setItemFormOpen(false);
  };

  // Express interest in an item (start chat locally)
  const handleItemInterest = (item: DonationItem) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to express interest.",
        variant: "destructive",
      });
      return;
    }
    if (user.id === item.donorId) {
      toast({
        title: "Notice",
        description: "You cannot show interest in your own item.",
        variant: "destructive",
      });
      return;
    }

    // Simulate starting a chat (for demo, just redirect to fake chat)
    // In real app, you'd create a conversation in localStorage
    toast({
      title: "Interest sent!",
      description: `A conversation was started with ${item.donorName} about "${item.title}".`
    });

    // You may want to check if a conversation exists in LS, else create one.
    navigate(`/chat/0`);
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Donations</h1>

      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-icons text-xl text-[#F5821D]">inventory_2</span>
            <h2 className="text-xl font-semibold">Items for Donation</h2>
          </div>
          <Button
            onClick={handleAddItem}
            className="bg-gradient-to-r from-[#F5821D] to-[#CE97E8] hover:from-[#CE97E8] hover:to-[#F5821D] text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Donate item
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5821D]"></div>
          </div>
        ) : donationItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-[#F5821D]/10 p-6 rounded-lg inline-flex flex-col items-center">
              <Gift className="h-12 w-12 text-[#F5821D] mb-3" />
              <h3 className="text-lg font-medium mb-2">No items for donation</h3>
              <p className="text-gray-600 mb-4 max-w-md">
                There are no items available for donation at the moment. You can register a donation item by clicking the button above.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {donationItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-48 bg-amber-100 relative overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#F5821D]/30 to-[#CE97E8]/30">
                        <Gift className="h-16 w-16 text-[#F5821D]" />
                      </div>
                    )}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/50"></div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-[#F5821D] to-[#CE97E8]">
                        {item.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="font-bold text-lg">{item.title}</h3>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{item.condition}</span>
                      <span className="text-sm text-gray-600">{item.location}</span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-[#F5821D] text-[#F5821D] hover:bg-[#F5821D]/10"
                        onClick={() => handleItemInterest(item)}
                      >
                        <Heart className="mr-2 h-4 w-4" /> I'm interested
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog for item donation */}
      <Dialog open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Donate an Item</DialogTitle>
            <DialogDescription>
              Fill in the details of the item you want to donate.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="item-title">Title</Label>
              <Input
                id="item-title"
                value={itemForm.title}
                onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                placeholder="Ex: Adult cat food"
              />
            </div>

            <div>
              <Label htmlFor="item-category">Category</Label>
              <Select value={itemForm.category} onValueChange={(value) => setItemForm({ ...itemForm, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Accessory">Accessory</SelectItem>
                  <SelectItem value="Hygiene">Hygiene</SelectItem>
                  <SelectItem value="Medicine">Medicine</SelectItem>
                  <SelectItem value="Toy">Toy</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item-condition">Condition</Label>
              <Select value={itemForm.condition} onValueChange={(value) => setItemForm({ ...itemForm, condition: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Almost new">Almost new</SelectItem>
                  <SelectItem value="Used - Good">Used - Good</SelectItem>
                  <SelectItem value="Used - Worn">Used - Worn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item-location">Location</Label>
              <Input
                id="item-location"
                value={itemForm.location}
                onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                placeholder="Ex: São Paulo, SP"
              />
            </div>

            <div>
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Describe details about the item, such as brand, size, quantity, etc."
                rows={3}
              />
            </div>

            <div>
              <Label className="block mb-2">Item Photo</Label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={itemPhotoInputRef}
                onChange={handleItemPhotoSelect}
              />

              {itemPhotoPreview ? (
                <div className="relative h-40 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={itemPhotoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 hover:bg-white transition-colors"
                    onClick={() => {
                      setItemPhoto(null);
                      setItemPhotoPreview(null);
                    }}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#F5821D] transition-colors"
                  onClick={() => itemPhotoInputRef.current?.click()}
                >
                  <Image className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to add a photo</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG or WEBP (max. 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setItemFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#F5821D] to-[#CE97E8]"
              onClick={handleRegisterItem}
            >
              Register Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NativeBottomNavigation />
    </div>
  );
}