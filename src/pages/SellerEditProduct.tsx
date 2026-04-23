import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Check } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { updateProductInDB, uploadProductImageWeb, fetchProductsBySellerFromDB } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const categories = ["Boulangerie", "Produits laitiers", "Fruits & Légumes", "Plats préparés", "Viandes", "Boissons", "Autre"];

const SellerEditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    originalPrice: "",
    reducedPrice: "",
    expiryDate: "",
    quantity: "1",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "seller") {
      navigate("/auth/seller", { replace: true });
      return;
    }
    fetchProductsBySellerFromDB(user.id).then((products) => {
      const product = products.find((p) => p.id === id);
      if (!product) {
        navigate("/seller/dashboard", { replace: true });
        return;
      }
      setForm({
        name: product.name,
        description: product.description,
        category: product.category,
        originalPrice: String(product.originalPrice),
        reducedPrice: String(product.reducedPrice),
        expiryDate: product.expiryDate,
        quantity: String(product.quantity),
      });
      setImagePreview(product.image);
      setLoadingProduct(false);
    });
  }, [loading, user, id, navigate]);

  if (loading || loadingProduct) {
    return (
      <MobileLayout mode="seller">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Veuillez choisir une image valide."); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) { toast.error("Veuillez choisir une catégorie."); return; }
    if (!id) return;

    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadProductImageWeb(imageFile, user!.id);
      }
      await updateProductInDB(id, {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        originalPrice: parseFloat(form.originalPrice),
        reducedPrice: parseFloat(form.reducedPrice),
        expiryDate: form.expiryDate,
        quantity: Math.max(1, parseInt(form.quantity, 10)),
        ...(imageUrl && { image: imageUrl }),
      });
      toast.success("Produit modifié !", { description: `${form.name} a été mis à jour.` });
      navigate("/seller/dashboard");
    } catch (err) {
      toast.error("Erreur lors de la modification.", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploading(false);
    }
  };

  const discount =
    form.originalPrice && form.reducedPrice
      ? Math.round(((parseFloat(form.originalPrice) - parseFloat(form.reducedPrice)) / parseFloat(form.originalPrice)) * 100)
      : 0;

  return (
    <MobileLayout mode="seller">
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg safe-top">
        <div className="flex items-center gap-3 h-14 px-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Modifier le produit</h1>
        </div>
      </header>

      <div className="px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image */}
          <div className="border-2 border-dashed rounded-2xl p-6 text-center transition-colors">
            <label htmlFor="product-image" className="cursor-pointer">
              {imagePreview ? (
                <img src={imagePreview} alt="Aperçu" className="mx-auto h-28 w-28 rounded-3xl object-cover" />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Ajouter une photo</p>
                </>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                {imagePreview ? "Changer la photo" : "Choisir une image"}
              </p>
            </label>
            <input id="product-image" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Nom du produit</label>
            <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description courte</label>
            <textarea required rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>

          {/* Catégorie */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button type="button" key={cat} onClick={() => update("category", cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${form.category === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Prix normal (FCFA)</label>
              <input type="number" step="1" min="0" required value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Prix réduit (FCFA)</label>
              <input type="number" step="1" min="0" required value={form.reducedPrice} onChange={(e) => update("reducedPrice", e.target.value)} className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums" />
            </div>
          </div>
          {discount > 0 && <p className="text-xs text-primary font-semibold">→ Réduction de {discount}%</p>}

          {/* Date & Quantité */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Date péremption</label>
              <input type="date" required value={form.expiryDate} onChange={(e) => update("expiryDate", e.target.value)} className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Quantité</label>
              <input type="number" min="1" required value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums" />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={uploading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-semibold active:scale-[0.98] transition-transform shadow-lg shadow-primary/20 disabled:opacity-60">
            <Check className="w-5 h-5" />
            {uploading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </MobileLayout>
  );
};

export default SellerEditProduct;
