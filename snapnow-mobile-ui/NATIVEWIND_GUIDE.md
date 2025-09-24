# NativeWind (Tailwind CSS) Setup & Usage 🎨

## ✅ **Setup hoàn tất!**

NativeWind đã được cài đặt và cấu hình thành công cho SnapNow app.

## 🎯 **Instagram Color Palette**

Đã config sẵn các màu Instagram trong `tailwind.config.js`:

```javascript
colors: {
  'instagram-blue': '#0095F6',      // Primary blue
  'instagram-light-blue': '#B2DFFC', // Light blue (disabled states)
  'instagram-dark': '#262626',       // Dark text
  'instagram-gray': '#8E8E8E',       // Gray text
  'instagram-light-gray': '#FAFAFA', // Light gray backgrounds
  'instagram-border': '#DBDBDB',     // Border colors
}
```

## 🚀 **Usage Examples**

### **Basic Layout Classes:**
```typescript
// Flexbox
className="flex-1 flex-row items-center justify-center"

// Spacing
className="px-4 py-3 mb-4 mx-2"

// Colors
className="bg-white text-instagram-dark border-instagram-border"

// Rounded corners
className="rounded-md rounded-full"
```

### **Instagram-style Components:**

#### **Button Styles:**
```typescript
// Primary button
className="bg-instagram-blue text-white py-3 px-6 rounded-md"

// Secondary button  
className="border border-instagram-border py-3 px-6 rounded-md"

// Disabled button
className="bg-instagram-light-blue text-white py-3 px-6 rounded-md"
```

#### **Input Styles:**
```typescript
// Input field
className="border border-instagram-border rounded-md px-4 py-3 bg-instagram-light-gray"

// Focused input
className="border-gray-400 bg-white"
```

#### **Typography:**
```typescript
// Headers
className="text-3xl font-bold text-instagram-dark"

// Body text
className="text-base text-instagram-dark"

// Secondary text
className="text-sm text-instagram-gray"
```

## 📱 **Instagram UI Patterns**

### **Post Card Layout:**
```typescript
<View className="bg-white mb-4">
  {/* Header */}
  <View className="flex-row items-center px-4 py-3">
    <Image className="w-8 h-8 rounded-full mr-3" />
    <Text className="font-semibold flex-1">username</Text>
  </View>
  
  {/* Content */}
  <Image className="w-full aspect-square" />
  
  {/* Actions */}
  <View className="flex-row items-center px-4 py-3 space-x-4">
    {/* Icons */}
  </View>
</View>
```

### **Story Circle:**
```typescript
<View className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
  <View className="w-full h-full rounded-full bg-white p-0.5">
    <Image className="w-full h-full rounded-full" />
  </View>
</View>
```

## 🔧 **Development Tips**

### **VS Code IntelliSense:**
NativeWind tạo file `nativewind-env.d.ts` để có autocomplete cho Tailwind classes.

### **Custom Components:**
```typescript
// components/InstagramUI.tsx
export const InstagramInput = ({ ... }) => (
  <TextInput className="border border-instagram-border rounded-md px-4 py-3" />
);

export const InstagramButton = ({ ... }) => (
  <TouchableOpacity className="bg-instagram-blue py-3 rounded-md">
    <Text className="text-white text-center font-semibold">Button</Text>
  </TouchableOpacity>
);
```

## 📚 **Useful Class Combinations**

### **Layout:**
- `flex-1` - Take full available space
- `flex-row` - Horizontal layout  
- `items-center` - Vertical center
- `justify-center` - Horizontal center
- `justify-between` - Space between items

### **Spacing:**
- `px-4 py-3` - Padding horizontal 16px, vertical 12px
- `mb-4` - Margin bottom 16px
- `space-x-4` - Space between children horizontally

### **Styling:**
- `rounded-md` - Medium border radius
- `border` - Add border
- `shadow-sm` - Small shadow
- `active:opacity-80` - Touch feedback

## 🎨 **Next Steps:**

1. ✅ **Login screen** - Đã convert sang NativeWind
2. 🔄 **Home feed** - Instagram-style feed layout
3. 🔄 **Profile screen** - User profile với grid layout
4. 🔄 **Search screen** - Grid discovery layout
5. 🔄 **Create post** - Camera/gallery interface

## 📖 **Documentation:**
- [NativeWind Docs](https://www.nativewind.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

---

**Lưu ý**: File `login-new.tsx` và `home-new.tsx` là examples sử dụng NativeWind. Bạn có thể replace các file gốc khi ready.