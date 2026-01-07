import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Smartphone, Monitor, Printer, Wifi, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: "Supported Devices & System Requirements | LogiVox",
  description: "Complete guide to compatible hardware, software requirements, and technical specifications for LogiVox WMS.",
}

export default function SupportedDevicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-primary-600">Technical Specifications</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Supported Devices & System Requirements
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              LogiVox works with a wide range of devices and platforms. Find out what you need to run your warehouse operations smoothly.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Get Hardware Recommendations</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20" asChild>
                <Link href="/help">View Setup Guides</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto">
            <Alert className="mb-12">
              <CheckCircle2 className="h-5 w-5" />
              <AlertTitle className="text-lg">Flexible Compatibility</AlertTitle>
              <AlertDescription className="text-base">
                LogiVox is designed to work with devices you already own. Whether you're using smartphones, dedicated scanners, or industrial tablets, we've got you covered.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-3 mb-12">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Mobile First</h3>
                  <p className="text-sm text-muted-foreground">
                    Native iOS and Android apps for warehouse floor operations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Cloud Based</h3>
                  <p className="text-sm text-muted-foreground">
                    Access from any modern web browser, no installation required
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
                    <Printer className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Hardware Agnostic</h3>
                  <p className="text-sm text-muted-foreground">
                    Compatible with major barcode scanner and printer brands
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Devices */}
      <section className="py-16 bg-slate-50">
        <div className="container-enterprise">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Mobile Devices</h2>
              <p className="text-lg text-muted-foreground">
                Use smartphones or industrial mobile computers for warehouse operations
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 mb-12">
              {/* iOS */}
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      iOS
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Apple iOS</h3>
                      <p className="text-sm text-muted-foreground">iPhone & iPad</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Minimum Requirements</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">iOS 14.0 or later</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">iPhone 7 or newer</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">iPad Air 2 or newer</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Camera for barcode scanning</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">WiFi or cellular data connection</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Recommended Devices</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• iPhone 12 or later (best performance)</li>
                        <li>• iPad (9th generation or later)</li>
                        <li>• iPad Pro (all models)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Android */}
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                      And
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Android</h3>
                      <p className="text-sm text-muted-foreground">Smartphones & Tablets</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Minimum Requirements</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Android 10.0 or later</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">2GB RAM minimum (4GB recommended)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Camera with autofocus for scanning</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">WiFi or cellular data connection</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">50MB free storage space</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Recommended Devices</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Samsung Galaxy A series or better</li>
                        <li>• Google Pixel (any model)</li>
                        <li>• Samsung Galaxy Tab A or S series</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Industrial Mobile Computers */}
            <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold mb-6">Industrial Mobile Computers</h3>
                <p className="text-muted-foreground mb-6">
                  For demanding warehouse environments, consider ruggedized mobile computers with integrated barcode scanners:
                </p>

                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <h4 className="font-semibold mb-3">Zebra Technologies</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>TC21 / TC26 Mobile Computer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>TC52 / TC57 Touch Computer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>TC72 / TC77 Ultra-Rugged</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>MC3300 Mobile Computer</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Honeywell</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>CT40 Mobile Computer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>CT60 / CT60 XP</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>CK65 Mobile Computer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>EDA51 Healthcare Tablet</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Datalogic</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>Memor 10 Mobile Computer</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>Skorpio X5 Handheld</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>Memor 20 PDA</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        <span>Joya Touch A6 Healthcare</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Alert className="mt-6">
                  <AlertDescription>
                    <strong>Android Enterprise Recommended:</strong> All industrial devices run Android Enterprise for enhanced security and device management capabilities.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Barcode Scanners */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Barcode Scanners</h2>
              <p className="text-lg text-muted-foreground">
                Compatible with USB, Bluetooth, and wireless barcode scanners
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 mb-12">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">USB Wired Scanners</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Plug-and-play scanners for desktop workstations
                  </p>
                  <h4 className="font-semibold text-sm mb-3">Recommended Models:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Zebra DS2208 / DS2278</li>
                    <li>• Honeywell Voyager 1200g</li>
                    <li>• Symbol LS2208</li>
                    <li>• Datalogic QuickScan QD2430</li>
                    <li>• Socket Mobile S700 Series</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Bluetooth Scanners</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Wireless scanners paired with mobile devices
                  </p>
                  <h4 className="font-semibold text-sm mb-3">Recommended Models:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Socket Mobile DuraScan D760</li>
                    <li>• Zebra CS4070 Companion</li>
                    <li>• Honeywell Voyager 1602g</li>
                    <li>• Datalogic Gryphon GBT4500</li>
                    <li>• Opticon OPN-2006</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Ring Scanners</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Wearable scanners for hands-free operation
                  </p>
                  <h4 className="font-semibold text-sm mb-3">Recommended Models:</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Zebra RS5100 Ring Scanner</li>
                    <li>• Honeywell 8680i Ring Scanner</li>
                    <li>• ProGlove Mark 2</li>
                    <li>• Socket Mobile SocketScan S740</li>
                    <li>• Datalogic PowerScan PBT9600</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary-200">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Supported Barcode Symbologies</h3>
                <p className="text-muted-foreground mb-6">
                  LogiVox supports all common 1D and 2D barcode formats:
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-3">1D Barcodes (Linear)</h4>
                    <ul className="grid grid-cols-2 gap-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>UPC-A / UPC-E</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>EAN-13 / EAN-8</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Code 39</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Code 128</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Code 93</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Interleaved 2 of 5</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Codabar</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>GS1-128</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">2D Barcodes (Matrix)</h4>
                    <ul className="grid grid-cols-2 gap-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>QR Code</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Data Matrix</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>PDF417</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Aztec Code</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>MaxiCode</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>GS1 DataBar</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Printers */}
      <section className="py-16 bg-slate-50">
        <div className="container-enterprise">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Label & Document Printers</h2>
              <p className="text-lg text-muted-foreground">
                Print shipping labels, barcode labels, and pick lists
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 mb-12">
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-6">Thermal Label Printers</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    For shipping labels and barcode labels (4x6 inch standard)
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="font-semibold mb-2">Zebra</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• ZD420 / ZD620 Desktop Printer</li>
                        <li>• ZT410 / ZT610 Industrial Printer</li>
                        <li>• ZD421 Cartridge Printer</li>
                        <li>• GK420d / GX420d</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Datamax / Honeywell</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• PC42t Desktop Printer</li>
                        <li>• PM43 / PM45 Industrial Printer</li>
                        <li>• RL4 Mobile Printer</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Rollo / DYMO</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Rollo Thermal Label Printer</li>
                        <li>• DYMO LabelWriter 4XL</li>
                        <li>• Brother QL-1110NWB</li>
                      </ul>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Recommended:</strong> Direct thermal printers (no ink/ribbon needed) for shipping labels. Thermal transfer for durable warehouse labels.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-6">Document Printers</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    For pick lists, packing slips, and reports
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="font-semibold mb-2">Standard Office Printers</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Any USB or network printer works</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Laser printers recommended for high volume</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Standard 8.5" x 11" letter size paper</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Popular Models</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• HP LaserJet Pro Series</li>
                        <li>• Brother HL-L Series</li>
                        <li>• Canon imageCLASS</li>
                        <li>• Epson WorkForce</li>
                      </ul>
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Print to PDF:</strong> No printer? Save documents as PDF and print later, or email pick lists directly to warehouse staff.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Printer Connection Methods</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">USB Direct</h4>
                    <p className="text-sm text-muted-foreground">Connect printer directly to computer via USB cable</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Network (Ethernet/WiFi)</h4>
                    <p className="text-sm text-muted-foreground">Share printer across multiple workstations on your network</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Cloud Print</h4>
                    <p className="text-sm text-muted-foreground">Print from mobile devices using cloud print services</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Desktop & Web Requirements */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Desktop & Web Access</h2>
              <p className="text-lg text-muted-foreground">
                System requirements for accessing LogiVox via web browser
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 mb-12">
              <Card>
                <CardContent className="p-8">
                  <Monitor className="h-12 w-12 text-primary-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-6">Computer Requirements</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Minimum Specifications</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span><strong>OS:</strong> Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span><strong>Processor:</strong> Intel Core i3 or AMD Ryzen 3 (or equivalent)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span><strong>RAM:</strong> 4GB minimum (8GB recommended)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span><strong>Display:</strong> 1280x720 minimum resolution (1920x1080 recommended)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span><strong>Internet:</strong> Broadband connection (minimum 5 Mbps)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <Globe className="h-12 w-12 text-primary-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-6">Supported Web Browsers</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Recommended Browsers</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Google Chrome</p>
                            <p className="text-sm text-muted-foreground">Version 90 or later (best performance)</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Microsoft Edge</p>
                            <p className="text-sm text-muted-foreground">Version 90 or later (Chromium-based)</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Mozilla Firefox</p>
                            <p className="text-sm text-muted-foreground">Version 88 or later</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Apple Safari</p>
                            <p className="text-sm text-muted-foreground">Version 14 or later (macOS only)</p>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <Alert>
                      <AlertDescription className="text-sm">
                        <strong>Note:</strong> JavaScript must be enabled. Cookies required for authentication. Pop-up blocker may need to be disabled for printing.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Network Requirements */}
      <section className="py-16 bg-slate-50">
        <div className="container-enterprise">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Network Requirements</h2>
              <p className="text-lg text-muted-foreground">
                Ensure your warehouse network meets these specifications
              </p>
            </div>

            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <Wifi className="h-12 w-12 text-primary-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Connectivity Requirements</h3>
                    <p className="text-muted-foreground">
                      LogiVox is a cloud-based system requiring stable internet connection
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-3">Internet Connection</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Minimum:</strong> 5 Mbps download / 2 Mbps upload</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Recommended:</strong> 25 Mbps download / 10 Mbps upload</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Latency:</strong> Under 100ms (lower is better)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Bandwidth:</strong> Add 1 Mbps per concurrent user</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Warehouse WiFi</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Standard:</strong> 802.11n (WiFi 4) minimum, 802.11ac (WiFi 5) or better recommended</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Coverage:</strong> Full warehouse coverage with minimal dead zones</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Security:</strong> WPA2 or WPA3 encryption</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Access Points:</strong> Consider multiple APs for large facilities</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Firewall & Security</h3>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    If your network has firewall restrictions, ensure these connections are allowed:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>HTTPS (443):</strong> For web application access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>WebSocket (443):</strong> For real-time updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Domains:</strong> *.logivox.com, *.logivox.app</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Need Help Choosing Hardware?</h2>
            <p className="text-xl mb-8 text-primary-100">
              Our team can recommend the best hardware setup for your warehouse size and budget.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" variant="outline" className="bg-white text-primary-600 hover:bg-primary-50" asChild>
                <Link href="/contact">Schedule Consultation</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30" asChild>
                <Link href="/help/getting-started/setup-mobile-devices">View Setup Guides</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container-enterprise">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Do I need to buy special hardware to use LogiVox?</h3>
                  <p className="text-sm text-muted-foreground">
                    No! LogiVox works with devices you likely already have. Any modern smartphone can scan barcodes using the camera. Standard computers with web browsers can access the full system. While industrial scanners and thermal printers improve efficiency, they're optional.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Can I use my existing barcode scanners?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes! Most USB and Bluetooth barcode scanners work with LogiVox. As long as your scanner operates in keyboard wedge mode (types like a keyboard), it will work. Check our compatibility list or contact support to verify your specific model.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Does LogiVox work offline?</h3>
                  <p className="text-sm text-muted-foreground">
                    LogiVox requires internet connection for full functionality. However, our mobile apps have limited offline mode that caches recent data and syncs when connection is restored. For critical operations, we recommend backup internet (cellular hotspot).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">What if my scanner model isn't listed?</h3>
                  <p className="text-sm text-muted-foreground">
                    The lists above show popular models, but LogiVox works with most scanners that support standard barcode symbologies. Contact our support team with your scanner model and we'll verify compatibility or help with configuration.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Do you provide hardware as part of the service?</h3>
                  <p className="text-sm text-muted-foreground">
                    LogiVox is software-only. However, we partner with hardware vendors to offer competitive pricing on recommended devices. We can also connect you with local suppliers. Contact us for hardware procurement assistance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
