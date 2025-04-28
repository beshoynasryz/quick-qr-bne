
export function Footer() {
  return (
    <footer className="bg-brand-gray py-6 mt-auto border-t border-gray-200">
      <div className="container text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} BNE QR Generator. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
