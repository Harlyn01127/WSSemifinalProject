"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseConfigurationIncomplete } from "@/lib/supabase";
import styles from "./page.module.css";

type AccountType = "buyer" | "seller";

type Profile = {
  id: string;
  display_name: string;
  account_type: AccountType;
  location: string;
};

type CartEntry = {
  productId: string;
  quantity: number;
};

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: {
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  condition: "New" | "Like new" | "Good";
  seller: string;
  location: string;
  rating: string;
  image: string;
  featured?: boolean;
  sellerId?: string;
};

const initialProducts: Product[] = [
  {
    id: "sample-1",
    name: "GeForce RTX 4070 SUPER",
    category: "Graphics Cards",
    price: 28900,
    condition: "Like new",
    seller: "Marco D.",
    location: "Quezon City",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=85",
    featured: true,
  },
  {
    id: "sample-2",
    name: "Ryzen 7 7800X3D",
    category: "Processors",
    price: 18950,
    condition: "Like new",
    seller: "Jules R.",
    location: "Makati",
    rating: "5.0",
    image:
      "https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-3",
    name: "ROG Strix B650E-F Gaming",
    category: "Motherboards",
    price: 12400,
    condition: "Good",
    seller: "Nica P.",
    location: "Pasig",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-4",
    name: "Corsair Vengeance DDR5 32GB",
    category: "Memory",
    price: 5350,
    condition: "New",
    seller: "ByteHub PH",
    location: "Manila",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-5",
    name: "Samsung 990 PRO NVMe 2TB",
    category: "Storage",
    price: 7890,
    condition: "Like new",
    seller: "Paolo C.",
    location: "Taguig",
    rating: "4.7",
    image:
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-6",
    name: "NZXT H5 Flow Mid Tower",
    category: "Cases & Cooling",
    price: 4200,
    condition: "Good",
    seller: "The PC Corner",
    location: "Mandaluyong",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-7",
    name: "MSI MAG A750GL 750W Gold",
    category: "Power Supplies",
    price: 4950,
    condition: "New",
    seller: "ByteHub PH",
    location: "Manila",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "sample-8",
    name: "DeepCool AK620 Zero Dark",
    category: "Cases & Cooling",
    price: 3150,
    condition: "Like new",
    seller: "Ken M.",
    location: "Caloocan",
    rating: "4.6",
    image:
      "https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=85",
  },
];

const categories = [
  { name: "All parts", icon: "✳" },
  { name: "Graphics Cards", icon: "▦" },
  { name: "Processors", icon: "▧" },
  { name: "Memory", icon: "▥" },
  { name: "Storage", icon: "▤" },
  { name: "Motherboards", icon: "▦" },
  { name: "Cases & Cooling", icon: "▢" },
  { name: "Power Supplies", icon: "ϟ" },
];

const peso = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4.25 10h11.5m-4.5-4.5 4.5 4.5-4.5 4.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>(supabase ? [] : initialProducts);
  const [activeCategory, setActiveCategory] = useState("All parts");
  const [search, setSearch] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSellerPromptOpen, setIsSellerPromptOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(Boolean(supabase));
  const [backendError, setBackendError] = useState("");
  const [notice, setNotice] = useState("");

  const showTransientNotice = (message: string, timeout = 2600) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), timeout);
  };

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;
    const loadProfile = (userId: string) => {
      void client
        .from("profiles")
        .select("id, display_name, account_type, location")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!active) return;
          if (error) {
            setBackendError(`Could not load your account profile: ${error.message}`);
            return;
          }
          if (!data) {
            setBackendError(
              "Your account profile is missing. Run the latest Supabase migration, then sign out and back in.",
            );
            return;
          }
          setProfile(data);
        });

      void Promise.all([
        client.from("favorites").select("product_id"),
        client.from("cart_items").select("product_id, quantity"),
        client
          .from("orders")
          .select("id, status, total, created_at, order_items(product_name, quantity, unit_price)")
          .order("created_at", { ascending: false }),
      ]).then(([favoriteResult, cartResult, orderResult]) => {
        if (!active) return;
        const dataError =
          favoriteResult.error ?? cartResult.error ?? orderResult.error;
        if (dataError) {
          setBackendError(`Could not load your saved items, cart, or orders: ${dataError.message}`);
          return;
        }
        setSaved((favoriteResult.data ?? []).map((item) => item.product_id));
        setCart(
          (cartResult.data ?? []).map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
          })),
        );
        setOrders(
          (orderResult.data ?? []).map((order) => ({
            id: order.id,
            status: order.status,
            total: Number(order.total),
            created_at: order.created_at,
            order_items: order.order_items.map((item) => ({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: Number(item.unit_price),
            })),
          })),
        );
      });
    };

    client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setBackendError(`Could not check your session: ${error.message}`);
        return;
      }
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      setProfile(null);
      if (sessionUser) loadProfile(sessionUser.id);
    });

    client
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setBackendError(
            error.code === "PGRST205" ||
              error.message.includes("Could not find the table 'public.products'")
              ? "The marketplace database is not installed yet. Run all SQL migrations in supabase/migrations/ in timestamp order, then refresh."
              : `Could not load listings: ${error.message}`,
          );
        } else {
          setProducts(
            (data ?? []).map((row) => ({
              id: row.id,
              name: row.name,
              category: row.category,
              price: Number(row.price),
              condition: row.condition as Product["condition"],
              seller: row.seller_name,
              location: row.location,
              rating: "New",
              image: row.image_url,
              sellerId: row.seller_id ?? undefined,
            })),
          );
        }
        setLoadingProducts(false);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      setProfile(null);
      setSaved([]);
      setCart([]);
      setOrders([]);
      if (sessionUser) {
        window.setTimeout(() => loadProfile(sessionUser.id), 0);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All parts" || product.category === activeCategory;
      const matchesSearch =
        !query ||
        `${product.name} ${product.category} ${product.seller}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch && (!showSavedOnly || saved.includes(product.id));
    });
  }, [activeCategory, products, saved, search, showSavedOnly]);

  const cartProducts = cart
    .map((entry) => ({
      product: products.find((product) => product.id === entry.productId),
      quantity: entry.quantity,
    }))
    .filter((entry): entry is { product: Product; quantity: number } =>
      Boolean(entry.product),
    );
  const cartCount = cart.reduce((total, entry) => total + entry.quantity, 0);

  async function toggleSaved(id: string) {
    if (supabase) {
      if (!user) {
        setIsSignUp(false);
        setIsAuthOpen(true);
        showTransientNotice("Sign in to save parts to your account");
        return;
      }

      const alreadySaved = saved.includes(id);
      const result = alreadySaved
        ? await supabase
            .from("favorites")
            .delete()
            .eq("buyer_id", user.id)
            .eq("product_id", id)
        : await supabase
            .from("favorites")
            .insert({ buyer_id: user.id, product_id: id });
      if (result.error) {
        setBackendError(`Could not update saved parts: ${result.error.message}`);
        return;
      }
      setSaved((current) =>
        alreadySaved ? current.filter((productId) => productId !== id) : [...current, id],
      );
      return;
    }

    setSaved((current) =>
      current.includes(id) ? current.filter((productId) => productId !== id) : [...current, id],
    );
  }

  async function addToCart(product: Product) {
    if (supabase) {
      if (!user) {
        setIsSignUp(false);
        setIsAuthOpen(true);
        showTransientNotice("Sign in to save your cart");
        return;
      }
      if (product.sellerId === user.id) {
        setBackendError("You cannot add your own listing to your buyer cart.");
        return;
      }
      const { error } = await supabase.rpc("change_cart_item", {
        p_product_id: product.id,
        p_quantity_delta: 1,
      });
      if (error) {
        setBackendError(`Could not update your cart: ${error.message}`);
        return;
      }
    }
    setCart((current) => {
      const existing = current.find((entry) => entry.productId === product.id);
      return existing
        ? current.map((entry) =>
            entry.productId === product.id
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry,
          )
        : [...current, { productId: product.id, quantity: 1 }];
    });
    showTransientNotice(`${product.name} added to your cart`);
  }

  async function changeCartQuantity(productId: string, delta: -1 | 1) {
    if (supabase) {
      if (!user) {
        setBackendError("Sign in to manage your saved cart.");
        return;
      }
      const { error } = await supabase.rpc("change_cart_item", {
        p_product_id: productId,
        p_quantity_delta: delta,
      });
      if (error) {
        setBackendError(`Could not update your cart: ${error.message}`);
        return;
      }
    }

    setCart((current) => {
      const entry = current.find((item) => item.productId === productId);
      if (!entry) return current;
      if (delta < 0 && entry.quantity === 1) {
        return current.filter((item) => item.productId !== productId);
      }
      return current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + delta }
          : item,
      );
    });
  }

  async function submitOrderRequest() {
    if (!supabase) {
      setBackendError("Order requests require a Supabase connection.");
      return;
    }
    if (!user) {
      setIsCartOpen(false);
      setIsSignUp(false);
      setIsAuthOpen(true);
      showTransientNotice("Sign in to submit an order request");
      return;
    }
    if (cart.length === 0) {
      setBackendError("Your cart is empty.");
      return;
    }

    const { data: orderId, error } = await supabase.rpc("place_order_request");
    if (error) {
      setBackendError(`Could not submit your order request: ${error.message}`);
      return;
    }

    const orderReference = typeof orderId === "string" ? orderId.slice(0, 8) : "request";

    setCart([]);
    setIsCartOpen(false);
    setIsOrdersOpen(true);
    setBackendError("");
    showTransientNotice(`Order request ${orderReference} saved. No payment was collected.`, 4000);

    const { data, error: historyError } = await supabase
      .from("orders")
      .select("id, status, total, created_at, order_items(product_name, quantity, unit_price)")
      .order("created_at", { ascending: false });
    if (historyError) {
      setBackendError(`Order was saved, but order history could not be refreshed: ${historyError.message}`);
      return;
    }
    setOrders(
      data.map((order) => ({
        id: order.id,
        status: order.status,
        total: Number(order.total),
        created_at: order.created_at,
        order_items: order.order_items.map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
        })),
      })),
    );
  }

  function openSellForm() {
    setEditingProduct(null);
    if (supabase) {
      if (!user) {
        setIsSignUp(true);
        setIsAuthOpen(true);
        return;
      }
      if (!profile) {
        setBackendError("Your account is still loading. Please try again in a moment.");
        return;
      }
      if (profile.account_type !== "seller") {
        setIsSellerPromptOpen(true);
        return;
      }
    }
    setIsSellOpen(true);
  }

  async function becomeSeller() {
    if (!supabase || !user) {
      setBackendError("Sign in to create a seller account.");
      return;
    }
    const { error } = await supabase.rpc("become_seller");
    if (error) {
      setBackendError(`Could not enable your seller account: ${error.message}`);
      return;
    }
    if (!profile) {
      setBackendError("Seller account was enabled, but your profile has not loaded. Refresh and sign in again.");
      return;
    }
    setProfile({ ...profile, account_type: "seller" });
    setIsSellerPromptOpen(false);
    setIsSellOpen(true);
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name")).trim();
    const price = Number(formData.get("price"));
    const category = String(formData.get("category"));
    const condition = String(formData.get("condition")) as Product["condition"];
    const image =
      String(formData.get("image")).trim() ||
      "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=85";

    if (!name) {
      setBackendError("Add a product name before publishing your listing.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setBackendError("Enter a valid price in PHP greater than zero.");
      return;
    }

    if (supabase && !user) {
      setIsSellOpen(false);
      setIsAuthOpen(true);
      setIsSignUp(true);
      showTransientNotice("Sign in to publish a listing");
      return;
    }
    if (supabase && profile?.account_type !== "seller") {
      setIsSellOpen(false);
      setIsSellerPromptOpen(true);
      return;
    }

    if (editingProduct && supabase) {
      if (!user) {
        setBackendError("Sign in with the seller account to edit this listing.");
        return;
      }
      const { data, error } = await supabase
        .from("products")
        .update({
          name,
          category,
          price,
          condition,
          image_url: image,
        })
        .eq("id", editingProduct.id)
        .select()
        .single();

      if (error) {
        setBackendError(`Could not update listing: ${error.message}`);
        return;
      }
      const updatedProduct: Product = {
        id: data.id,
        name: data.name,
        category: data.category,
        price: Number(data.price),
        condition: data.condition as Product["condition"],
        seller: data.seller_name,
        location: data.location,
        rating: "New",
        image: data.image_url,
        sellerId: data.seller_id,
      };
      setProducts((current) =>
        current.map((product) =>
          product.id === editingProduct.id ? updatedProduct : product,
        ),
      );
    } else if (editingProduct) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingProduct.id
            ? { ...product, name, category, price, condition, image }
            : product,
        ),
      );
    } else if (supabase && user) {
      const { data, error } = await supabase
        .from("products")
        .insert({
          seller_id: user.id,
          name,
          category,
          price,
          condition,
          location: profile?.location ?? "Metro Manila",
          image_url: image,
        })
        .select()
        .single();

      if (error) {
        setBackendError(`Could not publish listing: ${error.message}`);
        return;
      }

      setProducts((current) => [
        {
          id: data.id,
          name: data.name,
          category: data.category,
          price: Number(data.price),
          condition: data.condition as Product["condition"],
          seller: data.seller_name,
          location: data.location,
          rating: "New",
          image: data.image_url,
          sellerId: data.seller_id,
        },
        ...current,
      ]);
    } else {
      setProducts((current) => [
        {
          id: `demo-${Date.now()}`,
          name,
          category,
          price,
          condition,
          seller: "You",
          location: "Metro Manila",
          rating: "New seller",
          image,
        },
        ...current,
      ]);
    }
    setActiveCategory("All parts");
    setSearch("");
    setIsSellOpen(false);
    setEditingProduct(null);
    setBackendError("");
    showTransientNotice(
      editingProduct ? "Your listing has been updated" : "Your part is now listed in the marketplace",
    );
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("displayName") ?? "").trim();
    const accountType = String(formData.get("accountType") ?? "buyer");
    if (!email || !password) {
      setBackendError("Enter both an email address and a password.");
      return;
    }
    if (isSignUp && accountType !== "buyer" && accountType !== "seller") {
      setBackendError("Choose whether this is a buyer or seller account.");
      return;
    }
    const result = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              account_type: accountType,
            },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setBackendError(`Authentication failed: ${result.error.message}`);
      return;
    }
    if (isSignUp && !result.data.session) {
      showTransientNotice("Account created. Check your email to confirm, then sign in.", 3500);
    } else {
      showTransientNotice(
        isSignUp
          ? `Your ${accountType} account is ready`
          : "Welcome back",
        3500,
      );
    }
    setBackendError("");
    setIsAuthOpen(false);
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setBackendError(`Could not sign out: ${error.message}`);
      return;
    }
    showTransientNotice("You have signed out");
  }

  async function deleteListing(product: Product) {
    if (supabase) {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) {
        setBackendError(`Could not remove listing: ${error.message}`);
        return;
      }
    }
    setProducts((current) => current.filter((item) => item.id !== product.id));
    showTransientNotice("Listing removed");
  }

  return (
    <main className={styles.page}>
      <div className={styles.announcement}>
        <span className={styles.announcementDot} />
        The parts marketplace built for PC people
        <a href="#how-it-works">
          Find your next upgrade <ArrowIcon />
        </a>
      </div>

      <header className={styles.header}>
        <a className={styles.brand} href="#" aria-label="Partsy home">
          <span className={styles.brandMark}>p.</span>
          <span>partsy<span className={styles.brandDot}>.</span></span>
        </a>
        <nav className={styles.mainNav} aria-label="Main navigation">
          <a className={styles.navActive} href="#marketplace">Marketplace</a>
          <a href="#categories">Browse parts</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className={styles.headerActions}>
          <button
            className={styles.sellButton}
            onClick={openSellForm}
          >
            <span>＋</span> Sell a part
          </button>
          {supabase && user ? (
            <div className={styles.accountControls}>
              <span className={styles.accountIdentity}>
                <strong>{profile?.display_name ?? "Loading account…"}</strong>
                {profile && <small>{profile.account_type} account</small>}
              </span>
              <button
                className={styles.accountButton}
                onClick={() => {
                  setShowSavedOnly(true);
                  document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Saved ({saved.length})
              </button>
              <button
                className={styles.accountButton}
                onClick={() => setIsOrdersOpen(true)}
              >
                My orders
              </button>
              {profile?.account_type === "buyer" && (
                <button
                  className={styles.accountButton}
                  onClick={() => setIsSellerPromptOpen(true)}
                >
                  Become a seller
                </button>
              )}
              <button className={styles.accountButton} onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
          ) : (
            <button
              className={styles.accountButton}
              onClick={() => {
                setIsSignUp(false);
                setIsAuthOpen(true);
              }}
            >
              Sign in
            </button>
          )}
          <button
            className={styles.cartButton}
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open cart, ${cartCount} items`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 1.9-1.4L22 8H6" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            <span className={styles.cartCount}>{cartCount}</span>
          </button>
        </div>
      </header>

      {supabaseConfigurationIncomplete ? (
        <div className={styles.backendAlert} role="alert">
          Configure both Supabase URL and public key in `.env.local`; preview mode is active.
        </div>
      ) : supabase ? (
        backendError && (
          <div className={styles.backendAlert} role="alert">
            {backendError}
            {backendError.includes("public.products is missing") && (
              <button onClick={() => window.location.reload()}>Retry</button>
            )}
            <button onClick={() => setBackendError("")} aria-label="Dismiss error">×</button>
          </div>
        )
      ) : (
        <>
          <div className={styles.demoNotice}>
            Preview mode · Configure Supabase to enable accounts, saved carts, and orders
          </div>
          {backendError && (
            <div className={styles.backendAlert} role="alert">
              {backendError}
              <button onClick={() => setBackendError("")} aria-label="Dismiss error">×</button>
            </div>
          )}
        </>
      )}

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <span /> BUY BETTER. BUILD BIGGER.
          </div>
          <h1>
            Good parts.
            <br />
            <span>Great builds.</span>
          </h1>
          <p>
            Find the right components, score a better deal, or give your old
            gear a new home. All in one place.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#marketplace">
              Explore marketplace <ArrowIcon />
            </a>
            <button
              className={styles.textButton}
              onClick={openSellForm}
            >
              I have parts to sell
            </button>
          </div>
          <div className={styles.heroProof}>
            <div className={styles.avatarStack} aria-hidden="true">
              <span>J</span><span>M</span><span>A</span><span>K</span>
            </div>
            <div>
              <strong>2,400+ builders</strong>
              <span>already trading on Partsy</span>
            </div>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroPhoto} role="img" aria-label="A custom-built PC with glowing components" />
          <div className={styles.heroPhotoShade} />
          <div className={styles.heroSticker}>
            <span className={styles.stickerIcon}>✳</span>
            <span>Upgrade your setup.<br /><strong>Not your budget.</strong></span>
          </div>
          <div className={styles.heroImageLabel}>
            <span>CURATED FOR YOUR NEXT BUILD</span>
            <strong>Parts with a second life.</strong>
          </div>
          <div className={styles.photoCounter}><span>01</span> / 03</div>
        </div>
      </section>

      <section className={styles.trustStrip} aria-label="Marketplace benefits">
        <div><span className={styles.trustIcon}>✓</span><span><strong>Buyer protected</strong><small>Shop with confidence</small></span></div>
        <div><span className={styles.trustIcon}>↗</span><span><strong>Great prices</strong><small>Deals from real builders</small></span></div>
        <div><span className={styles.trustIcon}>⌖</span><span><strong>Local community</strong><small>Meet, trade, build</small></span></div>
        <div className={styles.trustNote}>THE UPGRADE LOOP <span>↻</span></div>
      </section>

      <section className={styles.marketplace} id="marketplace">
        <div className={styles.sectionHeading}>
          <div>
            <div className={styles.eyebrow}><span /> THE GOOD STUFF</div>
            <h2>Find your next <em>upgrade.</em></h2>
            <p>Hand-picked components from the community.</p>
          </div>
          <a className={styles.viewAll} href="#categories">Browse all parts <ArrowIcon /></a>
        </div>

        <div className={styles.searchRow}>
          <label className={styles.searchBox}>
            <SearchIcon />
            <input
              type="search"
              placeholder="Try “RTX 4070” or “DDR5”"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search computer parts"
            />
            <kbd>⌘ K</kbd>
          </label>
          <button
            className={styles.sortButton}
            onClick={() => {
              setProducts((current) =>
                [...current].sort((a, b) => a.price - b.price),
              );
              showTransientNotice("Sorted by price: lowest first");
            }}
          >
            <span>☷</span> Price: low to high
          </button>
        </div>

        <div className={styles.marketGrid} id="categories">
          <aside className={styles.sidebar}>
            <h3>Categories</h3>
            <div className={styles.categoryList}>
              {categories.map((category) => (
                <button
                  key={category.name}
                  className={`${styles.categoryButton} ${
                    activeCategory === category.name ? styles.categoryActive : ""
                  }`}
                  onClick={() => {
                    setActiveCategory(category.name);
                    setShowSavedOnly(false);
                  }}
                >
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  <span>{category.name}</span>
                  <small>
                    {category.name === "All parts"
                      ? products.length
                      : products.filter((product) => product.category === category.name).length}
                  </small>
                </button>
              ))}
            </div>
            <div className={styles.sellerCard}>
              <span className={styles.sellerSpark}>✳</span>
              <strong>Got parts collecting dust?</strong>
              <p>List your gear in minutes and pass the upgrade on.</p>
              <button onClick={openSellForm}>
                Start selling <ArrowIcon />
              </button>
            </div>
          </aside>

          <div className={styles.productArea}>
            <div className={styles.productTopline}>
              <span><strong>{visibleProducts.length} parts</strong> worth a look</span>
              {showSavedOnly ? (
                <button className={styles.savedFilter} onClick={() => setShowSavedOnly(false)}>
                  Saved parts · Clear
                </button>
              ) : (
                <span className={styles.conditionNote}><span /> All conditions, clearly listed</span>
              )}
            </div>
            {loadingProducts ? (
              <div className={styles.loadingState} role="status">Loading marketplace listings…</div>
            ) : visibleProducts.length > 0 ? (
              <div className={styles.productGrid}>
                {visibleProducts.map((product) => (
                  <article className={styles.productCard} key={product.id}>
                    <div
                      className={styles.productImage}
                      style={{ backgroundImage: `url("${product.image}")` }}
                      role="img"
                      aria-label={product.name}
                    >
                      {product.featured && <span className={styles.featuredTag}>✦ FEATURED</span>}
                      <span className={styles.conditionTag}>{product.condition}</span>
                      <button
                        className={`${styles.heartButton} ${saved.includes(product.id) ? styles.heartSaved : ""}`}
                        onClick={() => void toggleSaved(product.id)}
                        aria-label={saved.includes(product.id) ? "Remove from saved items" : "Save item"}
                      >
                        {saved.includes(product.id) ? "♥" : "♡"}
                      </button>
                    </div>
                    <div className={styles.productDetails}>
                      <div className={styles.productCategory}>{product.category}</div>
                      <h3>{product.name}</h3>
                      <div className={styles.productSeller}>
                        <span className={styles.sellerAvatar}>{product.seller.charAt(0)}</span>
                        <span>{product.seller}</span>
                        <span className={styles.rating}>★ {product.rating}</span>
                      </div>
                      {((supabase && product.sellerId === user?.id) ||
                        (!supabase && product.seller === "You")) && (
                        <div className={styles.ownerActions}>
                          <button onClick={() => {
                            setEditingProduct(product);
                            setIsSellOpen(true);
                          }}>Edit</button>
                          <button onClick={() => void deleteListing(product)}>Remove</button>
                        </div>
                      )}
                      <div className={styles.productBottom}>
                        <div><strong>{peso(product.price)}</strong><small> · {product.location}</small></div>
                        <button
                          className={styles.addButton}
                          onClick={() => void addToCart(product)}
                          aria-label={`Add ${product.name} to cart`}
                        >+</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span>⌕</span>
                {supabase && products.length === 0 ? (
                  <>
                    <h3>Your product catalog is empty</h3>
                    <p>
                      Supabase is connected, but no products are in the database yet.
                      Run <code>20261106000002_seed_marketplace_products.sql</code> from{" "}
                      <code>supabase/migrations/</code> in the Supabase SQL Editor, then refresh.
                    </p>
                  </>
                ) : (
                  <>
                    <h3>No parts found just yet</h3>
                    <p>Try a different search or pick another category.</p>
                    <button onClick={() => { setSearch(""); setActiveCategory("All parts"); }}>
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.howSection} id="how-it-works">
        <div>
          <div className={styles.eyebrow}><span /> THE PARTSY WAY</div>
          <h2>Build more.<br /><em>Waste less.</em></h2>
          <p>PC parts deserve a longer life. Partsy makes it easy to keep good gear in the game.</p>
        </div>
        <div className={styles.howSteps}>
          <div><span>01</span><strong>Find your fit</strong><p>Search parts by category, name, or the build you have in mind.</p></div>
          <div><span>02</span><strong>Make it yours</strong><p>Check condition, seller details, and price before you reach out.</p></div>
          <div><span>03</span><strong>Pass it on</strong><p>List your spare hardware and help another build come to life.</p></div>
        </div>
        <div className={styles.howDecoration} aria-hidden="true">p<span>.</span></div>
      </section>

      <footer className={styles.footer}>
        <a className={styles.brand} href="#">
          <span className={styles.brandMark}>p.</span>
          <span>partsy<span className={styles.brandDot}>.</span></span>
        </a>
        <span>Good parts deserve another build. © 2026 Partsy Market</span>
        <a href="#marketplace">Back to the top ↑</a>
      </footer>

      {notice && <div className={styles.toast} role="status">{notice}</div>}

      {isSellOpen && (
        <div className={styles.modalBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsSellOpen(false);
        }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="sell-title">
            <button className={styles.modalClose} onClick={() => setIsSellOpen(false)} aria-label="Close">×</button>
            <div className={styles.eyebrow}><span /> GIVE YOUR GEAR A NEW HOME</div>
            <h2 id="sell-title">{editingProduct ? "Edit your listing." : "List a part."}</h2>
            <p className={styles.modalIntro}>Add a few details to show your component to the Partsy community.</p>
            <form className={styles.sellForm} onSubmit={submitListing}>
              <label>Part name<input name="name" defaultValue={editingProduct?.name} placeholder="e.g. ASUS Dual RTX 3060" required maxLength={100} /></label>
              <div className={styles.formRow}>
                <label>Price (PHP)<input name="price" type="number" defaultValue={editingProduct?.price} placeholder="8500" min="1" step="1" required /></label>
                <label>Condition<select name="condition" defaultValue={editingProduct?.condition ?? "Like new"}><option>New</option><option>Like new</option><option>Good</option></select></label>
              </div>
              <label>Category<select name="category" defaultValue={editingProduct?.category ?? "Graphics Cards"}>{categories.slice(1).map((category) => <option key={category.name}>{category.name}</option>)}</select></label>
              <label>Photo URL <span className={styles.optional}>(optional)</span><input name="image" type="url" defaultValue={editingProduct?.image} placeholder="https://..." /></label>
              <button className={styles.primaryButton} type="submit">{editingProduct ? "Save changes" : "Publish listing"} <ArrowIcon /></button>
            </form>
            <p className={styles.formFootnote}>
              {supabase
                ? "Your listing is saved to your seller account in Supabase."
                : "Preview listing is added to this page only and resets when you refresh."}
            </p>
          </section>
        </div>
      )}

      {isSellerPromptOpen && (
        <div className={styles.modalBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsSellerPromptOpen(false);
        }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="seller-upgrade-title">
            <button className={styles.modalClose} onClick={() => setIsSellerPromptOpen(false)} aria-label="Close">×</button>
            <div className={styles.eyebrow}><span /> SELL WITH PARTSY</div>
            <h2 id="seller-upgrade-title">Open your seller account.</h2>
            <p className={styles.modalIntro}>
              Your buyer account stays the same. Seller access lets you publish and manage your own computer-part listings.
            </p>
            <div className={styles.sellerPromptActions}>
              <button className={styles.primaryButton} onClick={() => void becomeSeller()}>
                Become a seller <ArrowIcon />
              </button>
              <button className={styles.textButton} onClick={() => setIsSellerPromptOpen(false)}>
                Not now
              </button>
            </div>
            <p className={styles.formFootnote}>Seller permissions are enforced by Supabase, not just this page.</p>
          </section>
        </div>
      )}

      {isAuthOpen && (
        <div className={styles.modalBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsAuthOpen(false);
        }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className={styles.modalClose} onClick={() => setIsAuthOpen(false)} aria-label="Close">×</button>
            <div className={styles.eyebrow}><span /> YOUR PARTSY ACCOUNT</div>
            <h2 id="auth-title">{isSignUp ? "Create your account." : "Welcome back."}</h2>
            <p className={styles.modalIntro}>
              {isSignUp
                ? "Choose a buyer account or start as a seller. You can upgrade to seller later."
                : "Sign in to access your Partsy account."}
            </p>
            {supabase ? (
              <>
                <form className={styles.sellForm} onSubmit={submitAuth}>
                  {isSignUp && (
                    <>
                      <label>Your name<input name="displayName" autoComplete="name" required maxLength={80} /></label>
                      <label>
                        Account type
                        <select name="accountType" defaultValue="buyer">
                          <option value="buyer">Buyer — browse and shop parts</option>
                          <option value="seller">Seller — list and manage parts</option>
                        </select>
                      </label>
                    </>
                  )}
                  <label>Email<input name="email" type="email" autoComplete="email" required /></label>
                  <label>Password<input name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} required /></label>
                  <button className={styles.primaryButton} type="submit">{isSignUp ? "Create account" : "Sign in"} <ArrowIcon /></button>
                </form>
                <p className={styles.authSwitch}>
                  {isSignUp ? "Already have an account?" : "New to Partsy?"}{" "}
                  <button onClick={() => setIsSignUp((current) => !current)}>{isSignUp ? "Sign in" : "Create an account"}</button>
                </p>
              </>
            ) : (
              <div className={styles.accountSetupNotice} role="alert">
                Account sign-in and registration are unavailable because Supabase isn’t configured for this deployment. In Netlify, add
                {" "}NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as environment variables, then redeploy.
              </div>
            )}
          </section>
        </div>
      )}

      {isOrdersOpen && (
        <div className={styles.modalBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsOrdersOpen(false);
        }}>
          <section className={`${styles.modal} ${styles.ordersModal}`} role="dialog" aria-modal="true" aria-labelledby="orders-title">
            <button className={styles.modalClose} onClick={() => setIsOrdersOpen(false)} aria-label="Close">×</button>
            <div className={styles.eyebrow}><span /> YOUR PARTSY ACCOUNT</div>
            <h2 id="orders-title">Order requests</h2>
            <p className={styles.modalIntro}>Requests saved to your account. No payment has been collected.</p>
            {orders.length === 0 ? (
              <div className={styles.cartEmpty}>
                <span>⌑</span>
                <p>You haven’t submitted an order request yet.</p>
                <button className={styles.primaryButton} onClick={() => setIsOrdersOpen(false)}>
                  Browse parts <ArrowIcon />
                </button>
              </div>
            ) : (
              <div className={styles.orderList}>
                {orders.map((order) => (
                  <article className={styles.orderCard} key={order.id}>
                    <div className={styles.orderHeading}>
                      <div>
                        <strong>Request #{order.id.slice(0, 8)}</strong>
                        <small>{new Date(order.created_at).toLocaleString()}</small>
                      </div>
                      <span className={styles.orderStatus}>{order.status}</span>
                    </div>
                    <div className={styles.orderItems}>
                      {order.order_items.map((item, index) => (
                        <div key={`${order.id}-${index}`}>
                          <span>{item.product_name} × {item.quantity}</span>
                          <strong>{peso(item.unit_price * item.quantity)}</strong>
                        </div>
                      ))}
                    </div>
                    <div className={styles.orderTotal}>
                      <span>Request total (not charged)</span>
                      <strong>{peso(order.total)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {isCartOpen && (
        <div className={styles.modalBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsCartOpen(false);
        }}>
          <section className={`${styles.modal} ${styles.cartModal}`} role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <button className={styles.modalClose} onClick={() => setIsCartOpen(false)} aria-label="Close">×</button>
            <div className={styles.eyebrow}><span /> YOUR BUILD STARTS HERE</div>
            <h2 id="cart-title">Your cart <span className={styles.cartTitleCount}>({cartCount})</span></h2>
            {cartProducts.length === 0 ? (
              <div className={styles.cartEmpty}>
                <span>⌑</span>
                <p>Your cart is waiting for its first upgrade.</p>
                <button className={styles.primaryButton} onClick={() => setIsCartOpen(false)}>Explore parts <ArrowIcon /></button>
              </div>
            ) : (
              <>
                <div className={styles.cartItems}>
                  {cartProducts.map(({ product, quantity }) => (
                    <div className={styles.cartItem} key={product.id}>
                      <div className={styles.cartThumb} style={{ backgroundImage: `url("${product.image}")` }} />
                      <div className={styles.cartItemDetails}>
                        <strong>{product.name}</strong>
                        <small>{product.condition} · {product.location}</small>
                        <b>{peso(product.price * quantity)}</b>
                      </div>
                      <div className={styles.quantityControls}>
                        <button
                          onClick={() => void changeCartQuantity(product.id, -1)}
                          aria-label={`Decrease ${product.name} quantity`}
                        >−</button>
                        <span>{quantity}</span>
                        <button
                          onClick={() => void changeCartQuantity(product.id, 1)}
                          aria-label={`Increase ${product.name} quantity`}
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.cartTotal}><span>Order request total</span><strong>{peso(cartProducts.reduce((total, entry) => total + entry.product.price * entry.quantity, 0))}</strong></div>
                {!supabase && (
                  <div className={styles.accountSetupNotice} role="alert">
                    This preview cart cannot place an order. Configure Supabase for this deployment to enable sign-in and order requests.
                  </div>
                )}
                <button
                  className={styles.primaryButton}
                  disabled={!supabase}
                  onClick={() => void submitOrderRequest()}
                >
                  Submit order request <ArrowIcon />
                </button>
                <p className={styles.formFootnote}>Creates a pending request in Supabase. No payment is collected.</p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
