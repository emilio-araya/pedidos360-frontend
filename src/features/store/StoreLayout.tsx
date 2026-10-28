import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Brand } from "../../components/Brand";
import { useCart } from "./cart";
import { CartIcon } from "./icons";
import { formatProductCount } from "./productDisplay";
import "./StoreLayout.css";

/** Marco común de la tienda: barra con sesión y carrito, contenido y pie. */
export function StoreLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <div className="app-frame store">
      <header className="topbar">
        <div className="topbar__inner">
          <Brand to="/" />
          <nav className="store-nav" aria-label="Tienda">
            {isLoading ? null : isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="nav-button"
                  onClick={() => navigate("/orders")}
                >
                  Mis pedidos
                </button>
                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={() => navigate("/dashboard")}
                >
                  Mi cuenta
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => void login()}
              >
                Iniciar sesión
              </button>
            )}
            <Link
              className="store-cart-button"
              to="/carrito"
              aria-label={`Carrito, ${formatProductCount(count)}`}
            >
              <CartIcon />
              {count > 0 ? (
                <span className="store-cart-button__count" aria-hidden="true">
                  {count}
                </span>
              ) : null}
            </Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="store-footer">
        <div className="store-footer__inner">
          <Brand to="/" tagline="Catálogo público" />
          <span>
            Fotografías:{" "}
            <a
              href="https://commons.wikimedia.org"
              target="_blank"
              rel="noreferrer"
            >
              Wikimedia Commons
            </a>
            , dominio público y CC0.
          </span>
        </div>
      </footer>
    </div>
  );
}
