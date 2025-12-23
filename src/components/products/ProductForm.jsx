// ... imports ...
// અહીં useToast ઈમ્પોર્ટ કરવાનું ભૂલતા નહીં
import { useToast } from "../../context/ToastContext"; 

export default function ProductForm({ onClose, onSave, initial }) {
  const { addOrUpdateProduct, products } = useStore(); // products લિસ્ટ અહીં મળે છે
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast(); // Toast મેસેજ માટે

  // ... form state code ...

  const isEdit = !!(initial || id);

  // ... validate function ...

  return (
    // ... JSX code ...
    
          <button
            onClick={() => {
              if (validate()) {
                
                // ✅ FIX: ડુપ્લીકેટ નામ ચેક કરો
                if (!isEdit) { // માત્ર નવી પ્રોડક્ટ માટે
                    const exists = products.some(p => 
                        p.name.toLowerCase().trim() === form.name.toLowerCase().trim()
                    );

                    if (exists) {
                        toast.error("Product already exists! Please update stock instead.");
                        return; // અહીંથી પાછા વળી જાઓ
                    }
                }

                // જો બધું બરાબર હોય તો જ સેવ કરો
                if (onSave) onSave(form);
                else addOrUpdateProduct(form);
                navigate("/products");
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:bg-primary/90"
          >
            <Save className="w-5 h-5" />
            {isEdit ? "Save Changes" : "Add Product"}
          </button>
    // ...
  );
}