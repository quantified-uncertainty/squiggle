use wasm_bindgen::prelude::*;
use js_sys::Float64Array;
use rand::Rng;
use rand::thread_rng;
use kernel_density::kde;
use serde::{Serialize, Deserialize};
// use crate::distribution::bandwidth::{nrd0, nrd};

// TODO: impl a constructor such that xs.len() == ys.len().
#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct PdfCurve {
    xs: Vec<f64>,
    ys: Vec<f64>,
}

#[wasm_bindgen]
impl PdfCurve {
    #[wasm_bindgen(constructor)]
    pub fn new(xs: Vec<f64>, ys: Vec<f64>) -> Result<PdfCurve, String> {
        let mut sorted_zip: Vec<(&f64, &f64)> = xs.iter().zip(ys.iter()).collect();
        sorted_zip.sort_by(|a, b| a.0.partial_cmp(b.0).unwrap()); // Will panic if there are any NaN.
        return match xs.len() != ys.len() {
            true => return Err("error: xs and ys are not the same length".to_string()),
            false => {
                let xs: Vec<f64> = sorted_zip.iter().map(|a| *a.0).collect();
                let ys: Vec<f64> = sorted_zip.iter().map(|b| *b.1).collect();
                Ok(PdfCurve { xs: xs, ys: ys })
            },
        }
    }

    #[wasm_bindgen(getter)]
    pub fn xs(&self) -> Float64Array {
        Float64Array::from(&self.xs[..])
    }
    #[wasm_bindgen(getter)]
    pub fn ys(&self) -> Float64Array {
        Float64Array::from(&self.ys[..])
    }
}

pub fn samples_to_continuous_pdf(samples: Vec<f64>, bandwidth: f64) -> PdfCurve {
    let samples_to_map = samples.clone();
    let pdf = kde::normal(&samples, bandwidth);
    let pdf_curve = PdfCurve::new(samples, samples_to_map.iter().map(|x| pdf.density(*x)).collect());
    pdf_curve.unwrap()
}

pub fn sample_n(xs: Vec<f32>, n: i32) -> Vec<f32> {
    let m = xs.len();
    let mut output = vec![];
    for _ in 0..n {
        output.push(xs[thread_rng().gen_range(0..m)])
    }
    return output;
}
